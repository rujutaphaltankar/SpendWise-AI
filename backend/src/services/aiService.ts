import { z } from "zod";
import { env } from "../config/env";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  ExpenseCategory,
  PaymentMethod,
  DEFAULT_MERCHANT_CATEGORY_MAP,
} from "../config/constants";

// ---------- Output contract ----------
// Every provider (rule-based fallback or a real LLM) must produce something
// that satisfies this schema. Nothing downstream trusts provider output
// directly — it is always parsed through this schema first, per spec
// section 8: "Never blindly trust generated JSON."

export const extractedExpenseSchema = z.object({
  amount: z.number().positive().nullable(),
  merchant: z.string().trim().min(1).max(120),
  category: z.enum(EXPENSE_CATEGORIES),
  subcategory: z.string().trim().max(120).nullable().optional(),
  date: z.string(), // ISO date string
  paymentMethod: z.enum(PAYMENT_METHODS).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  confidence: z.number().min(0).max(1),
});

export type ExtractedExpense = z.infer<typeof extractedExpenseSchema>;

/**
 * Public entry point. Dispatches to whichever provider is configured via
 * AI_PROVIDER. Downstream callers never know or care which provider ran.
 */
export async function extractExpenseFromText(text: string): Promise<ExtractedExpense> {
  const raw =
    env.aiProvider === "anthropic" && env.aiApiKey
      ? await extractWithAnthropic(text)
      : ruleBasedExtract(text);

  const parsed = extractedExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    // Provider returned something malformed — never trust it, fall back to
    // the deterministic parser instead of surfacing bad data.
    const fallback = ruleBasedExtract(text);
    const fallbackParsed = extractedExpenseSchema.safeParse(fallback);
    if (!fallbackParsed.success) {
      throw new Error("Failed to extract a valid expense from the provided text");
    }
    return fallbackParsed.data;
  }

  return parsed.data;
}

// ---------- Rule-based deterministic fallback ----------
// Used whenever AI_PROVIDER is unset ("none"), and as the safety net when
// an LLM provider returns something that fails validation. Fully offline,
// fully deterministic, and unit-testable without any network access.

const CATEGORY_KEYWORDS: Array<{ pattern: RegExp; category: ExpenseCategory }> = [
  { pattern: /\bgrocer(y|ies)\b/i, category: "Groceries" },
  { pattern: /\brent\b/i, category: "Rent" },
  { pattern: /\bsubscription\b|\bnetflix\b|\bspotify\b|\bprime\b/i, category: "Subscriptions" },
  { pattern: /\bmovie\b|\bcinema\b|\bconcert\b|\bgame\b/i, category: "Entertainment" },
  { pattern: /\bdoctor\b|\bmedicine\b|\bhospital\b|\bpharmacy\b|\bclinic\b/i, category: "Healthcare" },
  { pattern: /\btuition\b|\bcourse\b|\bbook(s)?\b|\bexam\b|\bcollege\b/i, category: "Education" },
  { pattern: /\bflight\b|\bhotel\b|\btrip\b|\bvacation\b/i, category: "Travel" },
  { pattern: /\belectricity\b|\bwater bill\b|\bphone bill\b|\bwifi\b|\binternet bill\b/i, category: "Bills" },
  { pattern: /\bsalon\b|\bhaircut\b|\bspa\b/i, category: "Personal Care" },
  { pattern: /\buber\b|\bola\b|\brapido\b|\bcab\b|\bauto\b|\bpetrol\b|\bfuel\b|\bbus\b|\btrain\b/i, category: "Transportation" },
  { pattern: /\bamazon\b|\bflipkart\b|\bshopping\b|\bbought\b/i, category: "Shopping" },
];

export function inferCategory(text: string, merchant: string): ExpenseCategory {
  for (const { pattern, category } of CATEGORY_KEYWORDS) {
    if (pattern.test(text)) return category;
  }
  const merchantKey = merchant.toLowerCase();
  if (DEFAULT_MERCHANT_CATEGORY_MAP[merchantKey]) {
    return DEFAULT_MERCHANT_CATEGORY_MAP[merchantKey];
  }
  return "Other";
}

function extractAmount(text: string): number | null {
  const patterns = [
    /₹\s?([\d,]+(?:\.\d{1,2})?)/,
    /\brs\.?\s?([\d,]+(?:\.\d{1,2})?)/i,
    /\binr\s?([\d,]+(?:\.\d{1,2})?)/i,
    /(?:spent|paid|worth|cost)\s+(?:rs\.?|inr|₹)?\s?([\d,]+(?:\.\d{1,2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(value) && value > 0) return value;
    }
  }
  return null;
}

function extractMerchant(text: string): string {
  const lower = text.toLowerCase();
  const knownMerchants = Object.keys(DEFAULT_MERCHANT_CATEGORY_MAP).sort(
    (a, b) => b.length - a.length
  );

  for (const key of knownMerchants) {
    if (lower.includes(key)) {
      return key.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  const prepositionMatch = text.match(
    /(?:on|at|from|for)\s+([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*)/
  );
  if (prepositionMatch) return prepositionMatch[1].trim();

  const capitalizedMatch = text.match(/\b([A-Z][a-zA-Z]{2,})\b/);
  if (capitalizedMatch) return capitalizedMatch[1];

  return "Unknown merchant";
}

function extractPaymentMethod(text: string): PaymentMethod | null {
  const lower = text.toLowerCase();
  if (/\bupi\b/.test(lower)) return "UPI";
  if (/\bcash\b/.test(lower)) return "Cash";
  if (/\bdebit\b/.test(lower)) return "Debit Card";
  if (/\bcredit\b/.test(lower)) return "Credit Card";
  if (/\bbank transfer\b|\bneft\b|\bimps\b/.test(lower)) return "Bank Transfer";
  return null;
}

function extractDate(text: string): string {
  const lower = text.toLowerCase();
  const now = new Date();

  if (/\byesterday\b/.test(lower)) {
    now.setDate(now.getDate() - 1);
  }
  // "today" and unrecognized phrasing both default to now.

  return now.toISOString().slice(0, 10);
}

export function ruleBasedExtract(text: string): ExtractedExpense {
  const amount = extractAmount(text);
  const merchant = extractMerchant(text);
  const category = inferCategory(text, merchant);
  const paymentMethod = extractPaymentMethod(text);
  const date = extractDate(text);

  let confidence = 0.35;
  if (amount !== null) confidence += 0.3;
  if (merchant !== "Unknown merchant") confidence += 0.2;
  if (DEFAULT_MERCHANT_CATEGORY_MAP[merchant.toLowerCase()]) confidence += 0.1;
  confidence = Math.min(confidence, 0.95);
  if (amount === null) confidence = Math.min(confidence, 0.2);

  return {
    amount,
    merchant,
    category,
    subcategory: null,
    date,
    paymentMethod,
    description: text.trim().slice(0, 500),
    confidence: Math.round(confidence * 100) / 100,
  };
}

// ---------- Anthropic provider (used only when AI_PROVIDER=anthropic and AI_API_KEY is set) ----------

async function extractWithAnthropic(text: string): Promise<unknown> {
  const systemPrompt = `You extract structured expense data from short, casual, Indian-English spending descriptions.
Respond with ONLY a raw JSON object (no markdown, no prose) matching exactly this shape:
{"amount": number|null, "merchant": string, "category": one of ${JSON.stringify(EXPENSE_CATEGORIES)}, "subcategory": string|null, "date": "YYYY-MM-DD", "paymentMethod": one of ${JSON.stringify(PAYMENT_METHODS)}|null, "description": string|null, "confidence": number between 0 and 1}
Today's date is ${new Date().toISOString().slice(0, 10)}. If the text says "yesterday", subtract one day. If no date is mentioned, use today.
If you cannot confidently determine the amount, set it to null and confidence below 0.3.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.aiApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.aiModel || "claude-sonnet-4-6",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: text }],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider request failed with status ${response.status}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b: any) => b.type === "text");
  if (!textBlock) throw new Error("AI provider returned no text content");

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

// ---------- Natural-language insight generation ----------
// Used by the Insights and Assistant features. Different contract from
// expense extraction above: the caller has already computed all numbers
// deterministically (spec section 16/17); the AI's job is only to phrase
// an explanation of facts it's given — never to invent or recompute
// numbers itself.

export async function generateNaturalLanguageText(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (env.aiProvider === "anthropic" && env.aiApiKey) {
    return callAnthropicText(systemPrompt, userPrompt);
  }
  throw new Error("No AI provider configured");
}

async function callAnthropicText(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.aiApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.aiModel || "claude-sonnet-4-6",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider request failed with status ${response.status}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b: any) => b.type === "text");
  if (!textBlock) throw new Error("AI provider returned no text content");
  return textBlock.text.trim();
}
