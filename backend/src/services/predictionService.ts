import { Types } from "mongoose";
import { Expense } from "../models/Expense";
import { buildMonthBuckets } from "./analyticsService";
import { predictMonthlySpending, detectAnomalies, PredictionResult, AnomalyDetectionResult } from "./mlServiceClient";
import { ApiError } from "../utils/ApiError";

const HISTORY_MONTHS = 6;
const ANOMALY_LOOKBACK_DAYS = 90;

export async function getMonthlySpendingPrediction(userId: string): Promise<PredictionResult> {
  const userObjectId = new Types.ObjectId(userId);
  const buckets = buildMonthBuckets(HISTORY_MONTHS, new Date());

  const agg = await Expense.aggregate([
    { $match: { userId: userObjectId, date: { $gte: buckets[0].start, $lte: buckets[buckets.length - 1].end } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, total: { $sum: "$amount" } } },
  ]);
  const totalsByMonth = new Map(agg.map((r) => [r._id, r.total]));

  const monthlyHistory = buckets
    .map((b) => ({ month: b.label, total: totalsByMonth.get(b.label) ?? 0 }))
    .filter((m) => m.total > 0);

  if (monthlyHistory.length === 0) {
    throw new ApiError(422, "Not enough spending history to generate a prediction yet. Add a few expenses first.");
  }

  try {
    return await predictMonthlySpending(monthlyHistory);
  } catch (err) {
    throw new ApiError(503, "The prediction service is temporarily unavailable. Please try again shortly.", {
      originalError: err instanceof Error ? err.message : String(err),
    });
  }
}

export interface CategoryForecast {
  category: string;
  currentMonth: number;
  previousMonth: number;
  averageOfLast3Months: number;
  projected: number;
}

export async function getCategoryForecasts(userId: string): Promise<CategoryForecast[]> {
  const userObjectId = new Types.ObjectId(userId);
  const buckets = buildMonthBuckets(3, new Date());
  const [currentBucket] = buckets.slice(-1);
  const [previousBucket] = buckets.slice(-2, -1);

  const agg = await Expense.aggregate([
    { $match: { userId: userObjectId, date: { $gte: buckets[0].start, $lte: buckets[buckets.length - 1].end } } },
    {
      $group: {
        _id: { category: "$category", month: { $dateToString: { format: "%Y-%m", date: "$date" } } },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const byCategory = new Map<string, Map<string, number>>();
  for (const row of agg) {
    const category = row._id.category as string;
    const month = row._id.month as string;
    if (!byCategory.has(category)) byCategory.set(category, new Map());
    byCategory.get(category)!.set(month, row.total);
  }

  const forecasts: CategoryForecast[] = [];
  for (const [category, monthMap] of byCategory) {
    const currentMonth = monthMap.get(currentBucket.label) ?? 0;
    const previousMonth = monthMap.get(previousBucket?.label ?? "") ?? 0;
    const last3 = buckets.map((b) => monthMap.get(b.label) ?? 0);
    const averageOfLast3Months = round2(last3.reduce((s, v) => s + v, 0) / last3.length);
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const projected =
      dayOfMonth < daysInMonth
        ? round2((currentMonth / dayOfMonth) * daysInMonth)
        : round2(currentMonth || averageOfLast3Months);

    forecasts.push({ category, currentMonth: round2(currentMonth), previousMonth: round2(previousMonth), averageOfLast3Months, projected });
  }

  return forecasts.sort((a, b) => b.projected - a.projected);
}

export async function getAnomalies(userId: string): Promise<AnomalyDetectionResult> {
  const since = new Date();
  since.setDate(since.getDate() - ANOMALY_LOOKBACK_DAYS);

  const expenses = await Expense.find({ userId, date: { $gte: since } }).select("_id amount category date").lean();

  if (expenses.length === 0) {
    return { anomalies: [], method: "zscore", transactionsAnalyzed: 0 };
  }

  try {
    return await detectAnomalies(
      expenses.map((e) => ({
        id: String(e._id),
        amount: e.amount,
        category: e.category,
        date: e.date.toISOString().slice(0, 10),
      }))
    );
  } catch (err) {
    throw new ApiError(503, "The anomaly detection service is temporarily unavailable. Please try again shortly.", {
      originalError: err instanceof Error ? err.message : String(err),
    });
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
