import { FilterQuery, Types } from "mongoose";
import { Income, IIncome } from "../models/Income";
import { Expense } from "../models/Expense";
import { CreateIncomeInput, ListIncomeQuery, UpdateIncomeInput } from "../validators/incomeValidators";
import { ApiError } from "../utils/ApiError";
import { PaginatedResult } from "./expenseService";

function buildFilter(userId: string, query: ListIncomeQuery): FilterQuery<IIncome> {
  const filter: FilterQuery<IIncome> = { userId };
  if (query.source) filter.source = query.source;
  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = query.startDate;
    if (query.endDate) filter.date.$lte = query.endDate;
  }
  return filter;
}

export async function listIncome(
  userId: string,
  query: ListIncomeQuery
): Promise<PaginatedResult<IIncome>> {
  const filter = buildFilter(userId, query);
  const skip = (query.page - 1) * query.limit;
  const sort: Record<string, 1 | -1> = { date: query.sortOrder === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Income.find(filter).sort(sort).skip(skip).limit(query.limit),
    Income.countDocuments(filter),
  ]);

  return {
    items,
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function createIncome(userId: string, input: CreateIncomeInput): Promise<IIncome> {
  return Income.create({ ...input, userId });
}

export async function updateIncome(
  userId: string,
  incomeId: string,
  input: UpdateIncomeInput
): Promise<IIncome> {
  const income = await Income.findOneAndUpdate(
    { _id: incomeId, userId },
    { $set: input },
    { new: true, runValidators: true }
  );
  if (!income) {
    throw new ApiError(404, "Income record not found");
  }
  return income;
}

export async function deleteIncome(userId: string, incomeId: string): Promise<void> {
  const result = await Income.findOneAndDelete({ _id: incomeId, userId });
  if (!result) {
    throw new ApiError(404, "Income record not found");
  }
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  availableBalance: number;
  savingsRate: number; // percentage, 0-100, rounded to 1 decimal
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Pure, deterministic calculation — no LLM involvement, per spec section 3/16.
 * Given raw income and expense totals, computes balance and savings rate.
 * Exported separately from the DB-fetching wrapper below so it's unit-testable
 * without touching MongoDB.
 */
export function computeFinancialSummary(
  totalIncome: number,
  totalExpenses: number,
  periodStart: Date,
  periodEnd: Date
): FinancialSummary {
  const availableBalance = round2(totalIncome - totalExpenses);
  const savingsRate = totalIncome > 0 ? round1((availableBalance / totalIncome) * 100) : 0;

  return {
    totalIncome: round2(totalIncome),
    totalExpenses: round2(totalExpenses),
    availableBalance,
    savingsRate,
    periodStart,
    periodEnd,
  };
}

export async function getFinancialSummary(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<FinancialSummary> {
  const userObjectId = new Types.ObjectId(userId);

  const [incomeAgg, expenseAgg] = await Promise.all([
    Income.aggregate([
      { $match: { userId: userObjectId, date: { $gte: periodStart, $lte: periodEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Expense.aggregate([
      { $match: { userId: userObjectId, date: { $gte: periodStart, $lte: periodEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const totalIncome = incomeAgg[0]?.total ?? 0;
  const totalExpenses = expenseAgg[0]?.total ?? 0;

  return computeFinancialSummary(totalIncome, totalExpenses, periodStart, periodEnd);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
