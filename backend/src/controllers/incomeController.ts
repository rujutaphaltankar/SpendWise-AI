import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import * as incomeService from "../services/incomeService";
import { CreateIncomeInput, UpdateIncomeInput, ListIncomeQuery } from "../validators/incomeValidators";
import { ApiError } from "../utils/ApiError";

export const listIncome = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = (req as any).validatedQuery as ListIncomeQuery;
  const result = await incomeService.listIncome(req.userId!, query);
  res.status(200).json({ success: true, data: result });
});

export const createIncome = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body as CreateIncomeInput;
  const income = await incomeService.createIncome(req.userId!, body);
  res.status(201).json({ success: true, data: income });
});

export const updateIncome = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body as UpdateIncomeInput;
  const income = await incomeService.updateIncome(req.userId!, req.params.id, body);
  res.status(200).json({ success: true, data: income });
});

export const deleteIncome = asyncHandler(async (req: AuthRequest, res: Response) => {
  await incomeService.deleteIncome(req.userId!, req.params.id);
  res.status(200).json({ success: true, message: "Income record deleted" });
});

export const getFinancialSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

  let periodStart: Date;
  let periodEnd: Date;

  if (startDate && endDate) {
    periodStart = new Date(startDate);
    periodEnd = new Date(endDate);
    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      throw new ApiError(400, "Invalid startDate or endDate");
    }
  } else {
    // Default: current calendar month
    const now = new Date();
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const summary = await incomeService.getFinancialSummary(req.userId!, periodStart, periodEnd);
  res.status(200).json({ success: true, data: summary });
});
