import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import * as budgetService from "../services/budgetService";
import { CreateBudgetInput, UpdateBudgetInput } from "../validators/budgetValidators";

function currentMonthRange(): { periodStart: Date; periodEnd: Date } {
  const now = new Date();
  return {
    periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
    periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
}

export const listBudgets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { periodStart, periodEnd } = currentMonthRange();
  const budgets = await budgetService.listBudgetsWithProgress(req.userId!, periodStart, periodEnd);
  res.status(200).json({ success: true, data: budgets });
});

export const createBudget = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body as CreateBudgetInput;
  const budget = await budgetService.createBudget(req.userId!, body);
  res.status(201).json({ success: true, data: budget });
});

export const updateBudget = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body as UpdateBudgetInput;
  const budget = await budgetService.updateBudget(req.userId!, req.params.id, body);
  res.status(200).json({ success: true, data: budget });
});

export const deleteBudget = asyncHandler(async (req: AuthRequest, res: Response) => {
  await budgetService.deleteBudget(req.userId!, req.params.id);
  res.status(200).json({ success: true, message: "Budget deleted" });
});
