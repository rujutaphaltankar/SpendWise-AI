import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]).optional(),
  monthlyIncome: z.number().min(0).optional(),
  savingsGoalAmount: z.number().min(0).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]).optional(),
  monthlyIncome: z.number().min(0).optional(),
  savingsGoalAmount: z.number().min(0).optional(),
  preferredCategories: z.array(z.string()).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
