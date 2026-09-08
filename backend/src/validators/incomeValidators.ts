import { z } from "zod";
import { INCOME_SOURCES } from "../config/constants";

export const createIncomeSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  source: z.enum(INCOME_SOURCES),
  description: z.string().trim().max(500).optional(),
  date: z.coerce.date(),
});

export const updateIncomeSchema = createIncomeSchema.partial();

export const listIncomeQuerySchema = z.object({
  source: z.enum(INCOME_SOURCES).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
export type ListIncomeQuery = z.infer<typeof listIncomeQuerySchema>;
