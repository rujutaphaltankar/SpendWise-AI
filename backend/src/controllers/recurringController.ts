import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import { Expense } from "../models/Expense";
import { detectRecurringExpenses } from "../services/recurringDetectionService";
import { ApiError } from "../utils/ApiError";

const LOOKBACK_DAYS = 180;

export const detectRecurring = asyncHandler(async (req: AuthRequest, res: Response) => {
  const since = new Date();
  since.setDate(since.getDate() - LOOKBACK_DAYS);

  const expenses = await Expense.find({ userId: req.userId, date: { $gte: since } })
    .select("merchant category amount date")
    .lean();

  const candidates = detectRecurringExpenses(
    expenses.map((e) => ({ merchant: e.merchant, category: e.category, amount: e.amount, date: e.date }))
  );

  res.status(200).json({ success: true, data: candidates });
});

export const confirmRecurring = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { merchant, category } = req.body as { merchant?: string; category?: string };
  if (!merchant || !category) {
    throw new ApiError(400, "merchant and category are required");
  }

  const result = await Expense.updateMany(
    { userId: req.userId, merchant, category },
    { $set: { isRecurring: true } }
  );

  res.status(200).json({
    success: true,
    message: `Marked ${result.modifiedCount} expense(s) as recurring`,
  });
});
