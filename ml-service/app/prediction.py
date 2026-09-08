import numpy as np
from sklearn.linear_model import LinearRegression
from app.schemas import MonthlyDataPoint, PredictionResponse, ConfidenceRange


def predict_monthly_spending(history: list[MonthlyDataPoint]) -> PredictionResponse:
    """
    Predicts next month's spending from historical monthly totals.

    - With 3+ months of history: fits a simple linear regression against
      month index, and derives a confidence interval from the residual
      standard error. Deliberately simple and interpretable (spec section
      13: "Start with reliable interpretable models rather than
      unnecessarily complex deep learning").
    - With 1-2 months of history: falls back to a moving average, since a
      regression line through so few points is not meaningful. The
      confidence range is widened to honestly reflect the extra
      uncertainty (spec section 13: "Do not fabricate confidence scores").
    - With 0 months: raises, since there is nothing to predict from.
    """
    n = len(history)
    if n == 0:
        raise ValueError("At least one month of history is required to predict")

    totals = np.array([h.total for h in history], dtype=float)

    if n < 3:
        avg = float(np.mean(totals))
        spread = float(np.std(totals)) if n > 1 else avg * 0.25
        return PredictionResponse(
            predictedAmount=round(avg, 2),
            confidenceRange=ConfidenceRange(
                lower=round(max(avg - spread - avg * 0.15, 0), 2),
                upper=round(avg + spread + avg * 0.15, 2),
            ),
            model="moving-average",
            dataPointsUsed=n,
            method="insufficient-data-for-regression",
        )

    X = np.arange(n).reshape(-1, 1)
    y = totals

    model = LinearRegression()
    model.fit(X, y)

    next_index = np.array([[n]])
    predicted = float(model.predict(next_index)[0])
    predicted = max(predicted, 0.0)

    residuals = y - model.predict(X)
    residual_std = float(np.std(residuals)) if n > 2 else float(np.std(y))

    lower = max(predicted - residual_std, 0.0)
    upper = predicted + residual_std

    return PredictionResponse(
        predictedAmount=round(predicted, 2),
        confidenceRange=ConfidenceRange(lower=round(lower, 2), upper=round(upper, 2)),
        model="linear-regression",
        dataPointsUsed=n,
        method="ordinary-least-squares",
    )
