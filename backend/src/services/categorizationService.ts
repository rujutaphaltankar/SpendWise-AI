import { CategoryRule } from "../models/CategoryRule";
import { inferCategory } from "./aiService";
import { ExpenseCategory } from "../config/constants";

export interface CategorySuggestion {
  category: ExpenseCategory;
  confidence: number;
  source: "user-rule" | "merchant-keyword" | "default";
}

export async function suggestCategory(
  userId: string,
  merchant: string,
  contextText: string = ""
): Promise<CategorySuggestion> {
  const merchantKey = merchant.trim().toLowerCase();

  if (merchantKey) {
    const rule = await CategoryRule.findOne({ userId, merchantKey });
    if (rule) {
      return {
        category: rule.category as ExpenseCategory,
        confidence: Math.min(0.7 + rule.timesConfirmed * 0.05, 0.99),
        source: "user-rule",
      };
    }
  }

  const category = inferCategory(contextText || merchant, merchant);
  return {
    category,
    confidence: category === "Other" ? 0.3 : 0.6,
    source: category === "Other" ? "default" : "merchant-keyword",
  };
}

export async function recordCategoryCorrection(
  userId: string,
  merchant: string,
  category: string
): Promise<void> {
  const merchantKey = merchant.trim().toLowerCase();
  if (!merchantKey) return;

  await CategoryRule.findOneAndUpdate(
    { userId, merchantKey },
    { $set: { category }, $inc: { timesConfirmed: 1 } },
    { upsert: true, new: true }
  );
}
