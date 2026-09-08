import { SavingsGoal, ISavingsGoal } from "../models/SavingsGoal";
import { ApiError } from "../utils/ApiError";

export interface SavingsGoalProgress {
  goalId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
  targetDate: string | null;
  requiredMonthlySavings: number | null;
  estimatedCompletionDate: string | null;
  isComplete: boolean;
}

export function computeSavingsGoalProgress(
  goal: { id: string; name: string; targetAmount: number; currentAmount: number; targetDate: Date | null },
  today: Date = new Date()
): SavingsGoalProgress {
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const progressPercent = goal.targetAmount > 0 ? round1((goal.currentAmount / goal.targetAmount) * 100) : 0;
  const isComplete = goal.currentAmount >= goal.targetAmount;

  let requiredMonthlySavings: number | null = null;
  if (!isComplete && goal.targetDate) {
    const monthsRemaining = monthsBetween(today, goal.targetDate);
    requiredMonthlySavings = monthsRemaining > 0 ? round2(remaining / monthsRemaining) : remaining;
  }

  return {
    goalId: goal.id,
    name: goal.name,
    targetAmount: round2(goal.targetAmount),
    currentAmount: round2(goal.currentAmount),
    progressPercent,
    targetDate: goal.targetDate ? goal.targetDate.toISOString().slice(0, 10) : null,
    requiredMonthlySavings,
    estimatedCompletionDate: goal.targetDate ? goal.targetDate.toISOString().slice(0, 10) : null,
    isComplete,
  };
}

function monthsBetween(from: Date, to: Date): number {
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth()) +
    (to.getDate() >= from.getDate() ? 0 : -1);
  return Math.max(months, 1);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export async function listSavingsGoals(userId: string): Promise<SavingsGoalProgress[]> {
  const goals = await SavingsGoal.find({ userId }).sort({ createdAt: -1 });
  return goals.map((g) =>
    computeSavingsGoalProgress({
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      targetDate: g.targetDate ?? null,
    })
  );
}

export async function createSavingsGoal(
  userId: string,
  input: { name: string; targetAmount: number; currentAmount?: number; targetDate?: string }
): Promise<ISavingsGoal> {
  return SavingsGoal.create({
    userId,
    name: input.name,
    targetAmount: input.targetAmount,
    currentAmount: input.currentAmount ?? 0,
    targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
  });
}

export async function updateSavingsGoal(
  userId: string,
  goalId: string,
  input: Partial<{ name: string; targetAmount: number; currentAmount: number; targetDate: string }>
): Promise<ISavingsGoal> {
  const update: Record<string, unknown> = { ...input };
  if (input.targetDate) update.targetDate = new Date(input.targetDate);

  const goal = await SavingsGoal.findOneAndUpdate({ _id: goalId, userId }, { $set: update }, { new: true, runValidators: true });
  if (!goal) throw new ApiError(404, "Savings goal not found");
  return goal;
}

export async function deleteSavingsGoal(userId: string, goalId: string): Promise<void> {
  const result = await SavingsGoal.findOneAndDelete({ _id: goalId, userId });
  if (!result) throw new ApiError(404, "Savings goal not found");
}
