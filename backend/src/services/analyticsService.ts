import { Types } from "mongoose";
import { Expense } from "../models/Expense";
import { Income } from "../models/Income";

// ---------- Pure helpers (unit-testable without a DB) ----------

export interface MonthBucket {
  label: string; // "2026-08"
  start: Date;
  end: Date;
}

/**
 * Builds `monthsBack` consecutive calendar-month buckets ending with the
 * month containing `referenceDate`, oldest first. Pure function so the
 * month-window logic can be unit tested without touching MongoDB.
 */
export function buildMonthBuckets(monthsBack: number, referenceDate: Date): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const end = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() - i + 1,
      0,
      23,
      59,
      59,
      999
    );
    const label = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({ label, start, end });
  }
  return buckets;
}

export interface MonthComparison {
  currentMonthTotal: number;
  previousMonthTotal: number;
  changeAmount: number;
  changePercent: number | null; // null when previous month had no spending (undefined % change)
}

/**
 * Deterministic month-over-month comparison. Kept pure and separate from
 * the DB-fetching wrapper below so it's directly unit-testable.
 */
export function computeMonthComparison(
  currentMonthTotal: number,
  previousMonthTotal: number
): MonthComparison {
  const changeAmount = round2(currentMonthTotal - previousMonthTotal);
  const changePercent =
    previousMonthTotal > 0 ? round1((changeAmount / previousMonthTotal) * 100) : null;

  return {
    currentMonthTotal: round2(currentMonthTotal),
    previousMonthTotal: round2(previousMonthTotal),
    changeAmount,
    changePercent,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ---------- DB-backed aggregations ----------

export interface CategoryBreakdownItem {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export async function getCategoryBreakdown(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<CategoryBreakdownItem[]> {
  const userObjectId = new Types.ObjectId(userId);

  const results = await Expense.aggregate([
    { $match: { userId: userObjectId, date: { $gte: periodStart, $lte: periodEnd } } },
    { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  const grandTotal = results.reduce((sum, r) => sum + r.total, 0);

  return results.map((r) => ({
    category: r._id,
    total: round2(r.total),
    count: r.count,
    percentage: grandTotal > 0 ? round1((r.total / grandTotal) * 100) : 0,
  }));
}

export interface MonthlyTrendItem {
  month: string;
  totalIncome: number;
  totalExpenses: number;
}

export async function getMonthlyTrend(
  userId: string,
  monthsBack: number,
  referenceDate: Date = new Date()
): Promise<MonthlyTrendItem[]> {
  const userObjectId = new Types.ObjectId(userId);
  const buckets = buildMonthBuckets(monthsBack, referenceDate);
  const rangeStart = buckets[0].start;
  const rangeEnd = buckets[buckets.length - 1].end;

  const [expenseAgg, incomeAgg] = await Promise.all([
    Expense.aggregate([
      { $match: { userId: userObjectId, date: { $gte: rangeStart, $lte: rangeEnd } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          total: { $sum: "$amount" },
        },
      },
    ]),
    Income.aggregate([
      { $match: { userId: userObjectId, date: { $gte: rangeStart, $lte: rangeEnd } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          total: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const expenseMap = new Map(expenseAgg.map((r) => [r._id, r.total]));
  const incomeMap = new Map(incomeAgg.map((r) => [r._id, r.total]));

  return buckets.map((b) => ({
    month: b.label,
    totalIncome: round2(incomeMap.get(b.label) ?? 0),
    totalExpenses: round2(expenseMap.get(b.label) ?? 0),
  }));
}

export interface DailySpendingItem {
  date: string; // "2026-08-20"
  total: number;
}

export async function getDailySpending(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<DailySpendingItem[]> {
  const userObjectId = new Types.ObjectId(userId);

  const results = await Expense.aggregate([
    { $match: { userId: userObjectId, date: { $gte: periodStart, $lte: periodEnd } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return results.map((r) => ({ date: r._id, total: round2(r.total) }));
}

export interface BiggestTransaction {
  merchant: string;
  amount: number;
  category: string;
  date: Date;
}

export interface TopStats {
  topCategory: { category: string; total: number } | null;
  biggestTransaction: BiggestTransaction | null;
}

export async function getTopStats(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<TopStats> {
  const breakdown = await getCategoryBreakdown(userId, periodStart, periodEnd);
  const topCategory = breakdown.length > 0 ? { category: breakdown[0].category, total: breakdown[0].total } : null;

  const biggest = await Expense.findOne({
    userId,
    date: { $gte: periodStart, $lte: periodEnd },
  }).sort({ amount: -1 });

  const biggestTransaction: BiggestTransaction | null = biggest
    ? {
        merchant: biggest.merchant,
        amount: biggest.amount,
        category: biggest.category,
        date: biggest.date,
      }
    : null;

  return { topCategory, biggestTransaction };
}

export async function getMonthOverMonthComparison(
  userId: string,
  referenceDate: Date = new Date()
): Promise<MonthComparison> {
  const userObjectId = new Types.ObjectId(userId);
  const currentStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const currentEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999);
  const prevStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
  const prevEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0, 23, 59, 59, 999);

  const [currentAgg, prevAgg] = await Promise.all([
    Expense.aggregate([
      { $match: { userId: userObjectId, date: { $gte: currentStart, $lte: currentEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Expense.aggregate([
      { $match: { userId: userObjectId, date: { $gte: prevStart, $lte: prevEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  return computeMonthComparison(currentAgg[0]?.total ?? 0, prevAgg[0]?.total ?? 0);
}
