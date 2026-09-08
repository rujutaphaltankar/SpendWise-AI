import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import * as expenseService from "../services/expenseService";
import { CreateExpenseInput, UpdateExpenseInput, ListExpensesQuery } from "../validators/expenseValidators";

export const listExpenses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = (req as any).validatedQuery as ListExpensesQuery;
  const result = await expenseService.listExpenses(req.userId!, query);
  res.status(200).json({ success: true, data: result });
});

export const getExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const expense = await expenseService.getExpenseById(req.userId!, req.params.id);
  res.status(200).json({ success: true, data: expense });
});

export const createExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body as CreateExpenseInput;
  const expense = await expenseService.createExpense(req.userId!, body);
  res.status(201).json({ success: true, data: expense });
});

export const updateExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body as UpdateExpenseInput;
  const expense = await expenseService.updateExpense(req.userId!, req.params.id, body);
  res.status(200).json({ success: true, data: expense });
});

export const deleteExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  await expenseService.deleteExpense(req.userId!, req.params.id);
  res.status(200).json({ success: true, message: "Expense deleted" });
});
