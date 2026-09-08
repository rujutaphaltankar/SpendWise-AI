import numpy as np
import pandas as pd
from app.schemas import TransactionPoint, AnomalyResult, AnomalyDetectionResponse

# Threshold for the *modified* z-score (median/MAD based), per Iglewicz &
# Hoaglin's widely-used recommendation. Deliberately NOT a plain mean/std
# z-score: with a small sample, one large outlier inflates the mean and std
# dev enough to mask its own score (verified empirically — a ₹8,000 charge
# among four ₹450-600 charges scored only 2.0 under plain z-score, below a
# 2.5 threshold, because it dragged the std dev itself upward). Median/MAD
# is far more resistant to exactly this failure mode.
MODIFIED_Z_THRESHOLD = 3.5
MAD_SCALE_FACTOR = 0.6745
MIN_TRANSACTIONS_PER_CATEGORY = 4


def detect_anomalies(
    transactions: list[TransactionPoint], method: str = "zscore"
) -> AnomalyDetectionResponse:
    """
    Flags unusually large transactions *within their own category*, since
    what's "normal" for Rent is very different from what's normal for Food.
    Categories with too few transactions are skipped entirely rather than
    guessed at (spec section 15: "Show the actual data used to support the
    alert. Do not generate unsupported claims.").
    """
    if not transactions:
        return AnomalyDetectionResponse(anomalies=[], method=method, transactionsAnalyzed=0)

    df = pd.DataFrame([t.model_dump() for t in transactions])
    results: list[AnomalyResult] = []

    for category, group in df.groupby("category"):
        if len(group) < MIN_TRANSACTIONS_PER_CATEGORY:
            continue

        amounts = group["amount"].to_numpy(dtype=float)

        if method == "iqr":
            q1, q3 = np.percentile(amounts, [25, 75])
            iqr = q3 - q1
            upper_bound = q3 + 1.5 * iqr
            for _, row in group.iterrows():
                if row["amount"] > upper_bound and iqr > 0:
                    score = float((row["amount"] - q3) / iqr) if iqr > 0 else 0.0
                    results.append(
                        AnomalyResult(
                            id=row["id"],
                            amount=float(row["amount"]),
                            category=category,
                            date=row["date"],
                            reason=(
                                f"₹{row['amount']:.0f} is above the typical range for "
                                f"{category} (upper bound ₹{upper_bound:.0f}, based on "
                                f"{len(group)} transactions)"
                            ),
                            score=round(score, 2),
                        )
                    )
        else:  # zscore (default) — actually a robust modified z-score, see note above
            median = float(np.median(amounts))
            mad = float(np.median(np.abs(amounts - median)))
            if mad == 0:
                continue
            for _, row in group.iterrows():
                modified_z = MAD_SCALE_FACTOR * (row["amount"] - median) / mad
                if modified_z > MODIFIED_Z_THRESHOLD:
                    avg = float(np.mean(amounts))
                    results.append(
                        AnomalyResult(
                            id=row["id"],
                            amount=float(row["amount"]),
                            category=category,
                            date=row["date"],
                            reason=(
                                f"₹{row['amount']:.0f} is well above your typical "
                                f"{category} spend (median ₹{median:.0f}, average ₹{avg:.0f}, "
                                f"based on {len(group)} transactions)"
                            ),
                            score=round(float(modified_z), 2),
                        )
                    )

    results.sort(key=lambda r: r.score, reverse=True)
    return AnomalyDetectionResponse(
        anomalies=results, method=method, transactionsAnalyzed=len(transactions)
    )
