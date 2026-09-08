import { Types } from "mongoose";
import { Expense } from "../models/Expense";
import { getCategoryBreakdown, buildMonthBuckets, getTopStats } from "./analyticsService";
import { getFinancialSummary } from "./incomeService";
import { detectRecurringExpenses } from "./recurringDetectionService";
import { generateNaturalLanguageText } from "./aiService";
import { EXPENSE_CATEGORIES } from "../config/constants";

type Intent =
  | "category-spend"
  | "overspending"
  | "biggest-expense"
  | "last-month-spend"
  | "subscriptions"
  | "remaining-budget"
  | "general-summary";

function detectIntent(question: string): Intent {
  const q = question.toLowerCase();
  if (/subscription/.test(q)) return "subscriptions";
  if (/biggest|largest|most expensive/.test(q)) return "biggest-expense";
  if (/overspend|over budget|over my budget/.test(q)) return "overspending";
  if (/last month/.test(q)) return "last-month-spend";
  if (/how much can i spend|remaining|left (in|on) (my )?budget/.test(q)) return "remaining-budget";
  for (const category of EXPENSE_CATEGORIES) {
    if (q.includes(category.toLowerCase())) return "category-spend";
  }
  return "general-summary";
}

function findMentionedCategory(question: string): string | null {
  const q = question.toLowerCase();
  return EXPENSE_CATEGORIES.find((c) => q.includes(c.toLowerCase())) ?? null;
}

export interface AssistantFacts {
  intent: Intent;
  [key: string]: unknown;
}

export interface AssistantResponse {
  answer: string;
  facts: AssistantFacts;
  generatedBy: "ai" | "template";
}

async function gatherFacts(userId: string, question: string): Promise<AssistantFacts> {
  const intent = detectIntent(question);
  const userObjectId = new Types.ObjectId(userId);
  const buckets = buildMonthBuckets(2, new Date());
  const [previousBucket, currentBucket] = buckets;

  switch (intent) {
    case "category-spend": {
      const category = findMentionedCategory(question);
      const breakdown = await getCategoryBreakdown(userId, currentBucket.start, currentBucket.end);
      const match = breakdown.find((c) => c.category === category);
      return { intent, category, amount: match?.total ?? 0, hasData: !!match };
    }

    case "biggest-expense": {
      const { biggestTransaction } = await getTopStats(userId, currentBucket.start, currentBucket.end);
      return { intent, biggestTransaction };
    }

    case "last-month-spend": {
      const summary = await getFinancialSummary(userId, previousBucket.start, previousBucket.end);
      return { intent, totalExpenses: summary.totalExpenses };
    }

    case "subscriptions": {
      const since = new Date();
      since.setDate(since.getDate() - 180);
      const expenses = await Expense.find({ userId: userObjectId, date: { $gte: since } })
        .select("merchant category amount date")
        .lean();
      const recurring = detectRecurringExpenses(
        expenses.map((e) => ({ merchant: e.merchant, category: e.category, amount: e.amount, date: e.date }))
      );
      const subscriptions = recurring.filter((r) => r.category === "Subscriptions");
      return { intent, subscriptions };
    }

    case "remaining-budget":
    case "overspending":
    case "general-summary":
    default: {
      const summary = await getFinancialSummary(userId, currentBucket.start, currentBucket.end);
      const breakdown = await getCategoryBreakdown(userId, currentBucket.start, currentBucket.end);
      return { intent, ...summary, categoryBreakdown: breakdown };
    }
  }
}

function templateAnswer(facts: AssistantFacts): string {
  switch (facts.intent) {
    case "category-spend": {
      if (!facts.hasData) return `You haven't recorded any ${facts.category} expenses this month.`;
      return `You've spent ₹${(facts.amount as number).toLocaleString("en-IN")} on ${facts.category} this month.`;
    }
    case "biggest-expense": {
      const tx = facts.biggestTransaction as { merchant: string; amount: number; category: string } | null;
      if (!tx) return "You don't have any expenses recorded this month yet.";
      return `Your biggest expense this month was ₹${tx.amount.toLocaleString("en-IN")} at ${tx.merchant} (${tx.category}).`;
    }
    case "last-month-spend":
      return `You spent ₹${(facts.totalExpenses as number).toLocaleString("en-IN")} last month.`;
    case "subscriptions": {
      const subs = facts.subscriptions as { merchant: string; averageAmount: number }[];
      if (subs.length === 0) return "I couldn't detect any recurring subscriptions in your recent expenses.";
      const list = subs.map((s) => `${s.merchant} (₹${s.averageAmount.toLocaleString("en-IN")})`).join(", ");
      return `Here are the subscriptions I detected: ${list}.`;
    }
    default: {
      const totalExpenses = facts.totalExpenses as number;
      const availableBalance = facts.availableBalance as number;
      const breakdown = facts.categoryBreakdown as { category: string; total: number }[];
      const top = breakdown[0];
      let answer = `You've spent ₹${totalExpenses.toLocaleString("en-IN")} this month, with ₹${availableBalance.toLocaleString("en-IN")} remaining.`;
      if (top) answer += ` Your top category is ${top.category} at ₹${top.total.toLocaleString("en-IN")}.`;
      return answer;
    }
  }
}

export async function answerQuestion(userId: string, question: string): Promise<AssistantResponse> {
  const facts = await gatherFacts(userId, question);

  const systemPrompt = `You are a financial assistant. You will be given the user's question and a JSON object of verified facts already computed by the backend. Answer the question in 1-3 sentences using ONLY the facts provided — never invent transactions, amounts, or categories not present in the facts. If the facts don't contain enough information to answer, say so plainly.`;
  const userPrompt = `Question: ${question}\nFacts: ${JSON.stringify(facts)}`;

  try {
    const answer = await generateNaturalLanguageText(systemPrompt, userPrompt);
    return { answer, facts, generatedBy: "ai" };
  } catch {
    return { answer: templateAnswer(facts), facts, generatedBy: "template" };
  }
}
