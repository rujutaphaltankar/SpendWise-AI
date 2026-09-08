import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import * as savingsGoalService from "../services/savingsGoalService";
import { CreateSavingsGoalInput, UpdateSavingsGoalInput } from "../validators/savingsGoalValidators";

export const listGoals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const goals = await savingsGoalService.listSavingsGoals(req.userId!);
  res.status(200).json({ success: true, data: goals });
});

export const createGoal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body as CreateSavingsGoalInput;
  const goal = await savingsGoalService.createSavingsGoal(req.userId!, body);
  res.status(201).json({ success: true, data: goal });
});

export const updateGoal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body as UpdateSavingsGoalInput;
  const goal = await savingsGoalService.updateSavingsGoal(req.userId!, req.params.id, body);
  res.status(200).json({ success: true, data: goal });
});

export const deleteGoal = asyncHandler(async (req: AuthRequest, res: Response) => {
  await savingsGoalService.deleteSavingsGoal(req.userId!, req.params.id);
  res.status(200).json({ success: true, message: "Savings goal deleted" });
});
