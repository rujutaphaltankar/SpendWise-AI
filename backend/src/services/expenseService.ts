import { FilterQuery } from "mongoose";
import { Expense, IExpense } from "../models/Expense";
import { CreateExpenseInput, ListExpensesQuery, UpdateExpenseInput } from "../validators/expenseValidators";
import { ApiError } from "../utils/ApiError";
import { recordCategoryCorrection } from "./categorizationService";

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function buildFilter(userId: string, query: ListExpensesQuery): FilterQuery<IExpense> {
  const filter: FilterQuery<IExpense> = { userId };

  if (query.category) filter.category = query.category;
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
  if (query.isRecurring !== undefined) filter.isRecurring = query.isRecurring;

  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = query.startDate;
    if (query.endDate) filter.date.$lte = query.endDate;
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [{ merchant: regex }, { description: regex }, { subcategory: regex }];
  }

  return filter;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listExpenses(
  userId: string,
  query: ListExpensesQuery
): Promise<PaginatedResult<IExpense>> {
  const filter = buildFilter(userId, query);
  const skip = (query.page - 1) * query.limit;
  const sort: Record<string, 1 | -1> = { [query.sortBy]: query.sortOrder === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Expense.find(filter).sort(sort).skip(skip).limit(query.limit),
    Expense.countDocuments(filter),
  ]);

  return {
    items,
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function getExpenseById(userId: string, expenseId: string): Promise<IExpense> {
  const expense = await Expense.findOne({ _id: expenseId, userId });
  if (!expense) {
    throw new ApiError(404, "Expense not found");
  }
  return expense;
}

export async function createExpense(
  userId: string,
  input: CreateExpenseInput
): Promise<IExpense> {
  return Expense.create({
    ...input,
    userId,
    source: input.source ?? "manual",
    aiCategorized: false,
    isRecurring: input.isRecurring ?? false,
  });
}

export async function updateExpense(
  userId: string,
  expenseId: string,
  input: UpdateExpenseInput
): Promise<IExpense> {
  const existing = await Expense.findOne({ _id: expenseId, userId });
  if (!existing) {
    throw new ApiError(404, "Expense not found");
  }

  const categoryChanged = input.category && input.category !== existing.category;

  const expense = await Expense.findOneAndUpdate(
    { _id: expenseId, userId },
    { $set: input },
    { new: true, runValidators: true }
  );
  if (!expense) {
    throw new ApiError(404, "Expense not found");
  }

  if (categoryChanged) {
    recordCategoryCorrection(userId, expense.merchant, expense.category).catch(() => {});
  }

  return expense;
}

export async function deleteExpense(userId: string, expenseId: string): Promise<void> {
  const result = await Expense.findOneAndDelete({ _id: expenseId, userId });
  if (!result) {
    throw new ApiError(404, "Expense not found");
  }
}
