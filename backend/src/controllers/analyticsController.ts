import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import * as analyticsService from "../services/analyticsService";
import * as incomeService from "../services/incomeService";
import { DateRangeQuery, TrendsQuery } from "../validators/analyticsValidators";

function resolvePeriod(query: DateRangeQuery): { periodStart: Date; periodEnd: Date } {
  if (query.startDate && query.endDate) {
    return { periodStart: query.startDate, periodEnd: query.endDate };
  }
  const now = new Date();
  return {
    periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
    periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
}

export const getSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = (req as any).validatedQuery as DateRangeQuery;
  const { periodStart, periodEnd } = resolvePeriod(query);

  const [financialSummary, topStats, monthComparison] = await Promise.all([
    incomeService.getFinancialSummary(req.userId!, periodStart, periodEnd),
    analyticsService.getTopStats(req.userId!, periodStart, periodEnd),
    analyticsService.getMonthOverMonthComparison(req.userId!),
  ]);

  res.status(200).json({
    success: true,
    data: {
      ...financialSummary,
      topCategory: topStats.topCategory,
      biggestTransaction: topStats.biggestTransaction,
      monthComparison,
    },
  });
});

export const getCategoryBreakdown = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = (req as any).validatedQuery as DateRangeQuery;
  const { periodStart, periodEnd } = resolvePeriod(query);

  const breakdown = await analyticsService.getCategoryBreakdown(req.userId!, periodStart, periodEnd);
  res.status(200).json({ success: true, data: breakdown });
});

export const getTrends = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = (req as any).validatedQuery as TrendsQuery;

  const [monthlyTrend, dailySpending] = await Promise.all([
    analyticsService.getMonthlyTrend(req.userId!, query.months),
    analyticsService.getDailySpending(
      req.userId!,
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999)
    ),
  ]);

  res.status(200).json({ success: true, data: { monthlyTrend, dailySpending } });
});
