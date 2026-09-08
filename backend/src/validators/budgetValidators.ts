import { z } from "zod";
import { EXPENSE_CATEGORIES } from "../config/constants";

export const createBudgetSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES).nullable().optional(),
  amount: z.number().positive("Budget amount must be greater than 0"),
  thresholds: z.array(z.number().min(1).max(200)).min(1).optional(),
});

export const updateBudgetSchema = z.object({
  amount: z.number().positive().optional(),
  thresholds: z.array(z.number().min(1).max(200)).min(1).optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
