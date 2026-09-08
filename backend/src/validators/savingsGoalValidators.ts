import { z } from "zod";

export const createSavingsGoalSchema = z.object({
  name: z.string().trim().min(1).max(120),
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0).optional(),
  targetDate: z.string().optional(),
});

export const updateSavingsGoalSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  targetDate: z.string().optional(),
});

export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>;
export type UpdateSavingsGoalInput = z.infer<typeof updateSavingsGoalSchema>;
