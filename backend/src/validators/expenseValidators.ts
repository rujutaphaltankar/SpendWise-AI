import { z } from "zod";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, EXPENSE_SOURCES } from "../config/constants";

export const createExpenseSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  merchant: z.string().trim().min(1, "Merchant is required").max(120),
  category: z.enum(EXPENSE_CATEGORIES),
  subcategory: z.string().trim().max(120).optional(),
  date: z.coerce.date(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  description: z.string().trim().max(500).optional(),
  receiptUrl: z.string().trim().url().optional(),
  source: z.enum(EXPENSE_SOURCES).optional(),
  isRecurring: z.boolean().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const listExpensesQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  isRecurring: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(["date", "amount", "merchant", "category"]).optional().default("date"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
