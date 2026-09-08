import { Types } from "mongoose";
import { Budget } from "../models/Budget";
import { getCategoryBreakdown, buildMonthBuckets } from "./analyticsService";
import { getFinancialSummary } from "./incomeService";
import { getMonthlySpendingPrediction } from "./predictionService";
import { generateNaturalLanguageText } from "./aiService";

export interface InsightFacts {
  topCategory: string | null;
  topCategoryAmount: number | null;
  topCategoryChangePercent: number | null;
  monthlyProjectedSpend: number | null;
  budgetRemaining: number | null;
  savingsRate: number;
  totalExpensesThisMonth: number;
}

export interface InsightResponse {
  facts: InsightFacts;
  explanation: string;
  generatedBy: "ai" | "template";
}

async function computeInsightFacts(userId: string): Promise<InsightFacts> {
  const userObjectId = new Types.ObjectId(userId);
  const buckets = buildMonthBuckets(2, new Date());
  const [previousBucket, currentBucket] = buckets;

  const [currentBreakdown, previousBreakdown, financialSummary] = await Promise.all([
    getCategoryBreakdown(userId, currentBucket.start, currentBucket.end),
    getCategoryBreakdown(userId, previousBucket.start, previousBucket.end),
    getFinancialSummary(userId, currentBucket.start, currentBucket.end),
  ]);

  const topCategory = currentBreakdown[0]?.category ?? null;
  const topCategoryAmount = currentBreakdown[0]?.total ?? null;

  let topCategoryChangePercent: number | null = null;
  if (topCategory) {
    const previousAmount = previousBreakdown.find((c) => c.category === topCategory)?.total ?? 0;
    if (previousAmount > 0 && topCategoryAmount !== null) {
      topCategoryChangePercent = Math.round(((topCategoryAmount - previousAmount) / previousAmount) * 1000) / 10;
    }
  }

  let monthlyProjectedSpend: number | null = null;
  try {
    const prediction = await getMonthlySpendingPrediction(userId);
    monthlyProjectedSpend = prediction.predictedAmount;
  } catch {
    monthlyProjectedSpend = null;
  }

  const overallBudget = await Budget.findOne({ userId: userObjectId, category: null });
  const budgetRemaining = overallBudget
    ? Math.round((overallBudget.amount - financialSummary.totalExpenses) * 100) / 100
    : null;

  return {
    topCategory,
    topCategoryAmount,
    topCategoryChangePercent,
    monthlyProjectedSpend,
    budgetRemaining,
    savingsRate: financialSummary.savingsRate,
    totalExpensesThisMonth: financialSummary.totalExpenses,
  };
}

function templateExplanation(facts: InsightFacts): string {
  const sentences: string[] = [];

  if (facts.topCategory && facts.topCategoryAmount !== null) {
    if (facts.topCategoryChangePercent !== null && facts.topCategoryChangePercent !== 0) {
      const direction = facts.topCategoryChangePercent > 0 ? "up" : "down";
      sentences.push(
        `${facts.topCategory} is your top spending category this month at ₹${facts.topCategoryAmount.toLocaleString("en-IN")}, ${direction} ${Math.abs(facts.topCategoryChangePercent)}% from last month.`
      );
    } else {
      sentences.push(`${facts.topCategory} is your top spending category this month at ₹${facts.topCategoryAmount.toLocaleString("en-IN")}.`);
    }
  } else {
    sentences.push("No expenses recorded yet this month.");
  }

  if (facts.monthlyProjectedSpend !== null) {
    sentences.push(`At this pace, you're projected to spend around ₹${facts.monthlyProjectedSpend.toLocaleString("en-IN")} this month.`);
  }

  if (facts.budgetRemaining !== null) {
    sentences.push(
      facts.budgetRemaining >= 0
        ? `You have ₹${facts.budgetRemaining.toLocaleString("en-IN")} left in your overall budget.`
        : `You're ₹${Math.abs(facts.budgetRemaining).toLocaleString("en-IN")} over your overall budget.`
    );
  }

  sentences.push(`Your savings rate this month is ${facts.savingsRate}%.`);

  return sentences.join(" ");
}

export async function generateInsight(userId: string): Promise<InsightResponse> {
  const facts = await computeInsightFacts(userId);

  const systemPrompt = `You are a financial insight assistant. You will be given verified facts about a user's spending as JSON. Write a short (2-3 sentence), friendly, plain-English explanation using ONLY the facts provided. Never invent numbers, transactions, or categories not present in the facts. If a fact is null, simply don't mention it.`;
  const userPrompt = JSON.stringify(facts);

  try {
    const explanation = await generateNaturalLanguageText(systemPrompt, userPrompt);
    return { facts, explanation, generatedBy: "ai" };
  } catch {
    return { facts, explanation: templateExplanation(facts), generatedBy: "template" };
  }
}
