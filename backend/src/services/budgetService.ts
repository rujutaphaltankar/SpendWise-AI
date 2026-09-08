import { Types } from "mongoose";
import { Budget, IBudget } from "../models/Budget";
import { Expense } from "../models/Expense";
import { CreateBudgetInput, UpdateBudgetInput } from "../validators/budgetValidators";
import { ApiError } from "../utils/ApiError";

export interface BudgetProgress {
  budgetId: string;
  category: string | null;
  amount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  thresholds: number[];
  crossedThresholds: number[];
  status: "on-track" | "warning" | "exceeded";
}

export function computeBudgetProgress(
  budget: { id: string; category: string | null; amount: number; thresholds: number[] },
  spent: number
): BudgetProgress {
  const remaining = round2(budget.amount - spent);
  const percentUsed = budget.amount > 0 ? round1((spent / budget.amount) * 100) : 0;

  const sortedThresholds = [...budget.thresholds].sort((a, b) => a - b);
  const crossedThresholds = sortedThresholds.filter((t) => percentUsed >= t);

  let status: BudgetProgress["status"] = "on-track";
  if (percentUsed >= 100) status = "exceeded";
  else if (percentUsed >= (sortedThresholds.find((t) => t < 100) ?? 75)) status = "warning";

  return {
    budgetId: budget.id,
    category: budget.category,
    amount: round2(budget.amount),
    spent: round2(spent),
    remaining,
    percentUsed,
    thresholds: sortedThresholds,
    crossedThresholds,
    status,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export async function listBudgetsWithProgress(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<BudgetProgress[]> {
  const userObjectId = new Types.ObjectId(userId);
  const budgets = await Budget.find({ userId });

  const spendByCategory = await Expense.aggregate([
    { $match: { userId: userObjectId, date: { $gte: periodStart, $lte: periodEnd } } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
  ]);
  const categoryTotals = new Map(spendByCategory.map((r) => [r._id, r.total]));
  const overallTotal = spendByCategory.reduce((sum, r) => sum + r.total, 0);

  return budgets.map((budget) => {
    const spent = budget.category ? categoryTotals.get(budget.category) ?? 0 : overallTotal;
    return computeBudgetProgress(
      { id: budget.id, category: budget.category, amount: budget.amount, thresholds: budget.thresholds },
      spent
    );
  });
}

export async function createBudget(userId: string, input: CreateBudgetInput): Promise<IBudget> {
  const category = input.category ?? null;

  const existing = await Budget.findOne({ userId, category });
  if (existing) {
    throw new ApiError(
      409,
      category ? `A budget for ${category} already exists` : "An overall budget already exists"
    );
  }

  return Budget.create({
    userId,
    category,
    amount: input.amount,
    thresholds: input.thresholds ?? [50, 75, 90, 100],
  });
}

export async function updateBudget(
  userId: string,
  budgetId: string,
  input: UpdateBudgetInput
): Promise<IBudget> {
  const budget = await Budget.findOneAndUpdate(
    { _id: budgetId, userId },
    { $set: input },
    { new: true, runValidators: true }
  );
  if (!budget) {
    throw new ApiError(404, "Budget not found");
  }
  return budget;
}

export async function deleteBudget(userId: string, budgetId: string): Promise<void> {
  const result = await Budget.findOneAndDelete({ _id: budgetId, userId });
  if (!result) {
    throw new ApiError(404, "Budget not found");
  }
}
