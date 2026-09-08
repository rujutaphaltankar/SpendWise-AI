// Centralized, configurable enums. Kept as data (not scattered magic strings)
// so merchant-mapping, categorization, and future admin-configurability
// (spec section 21) can extend this in one place.

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transportation",
  "Shopping",
  "Bills",
  "Education",
  "Entertainment",
  "Healthcare",
  "Rent",
  "Subscriptions",
  "Travel",
  "Groceries",
  "Personal Care",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAYMENT_METHODS = [
  "UPI",
  "Cash",
  "Debit Card",
  "Credit Card",
  "Bank Transfer",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const EXPENSE_SOURCES = ["manual", "natural-language", "receipt"] as const;
export type ExpenseSource = (typeof EXPENSE_SOURCES)[number];

export const INCOME_SOURCES = [
  "salary",
  "freelance",
  "allowance",
  "scholarship",
  "other",
] as const;
export type IncomeSource = (typeof INCOME_SOURCES)[number];

// Merchant -> category mapping used by the deterministic categorization
// pass (Milestone 6 extends this). Configurable, not hard-coded into
// core architecture, per spec section 21.
export const DEFAULT_MERCHANT_CATEGORY_MAP: Record<string, ExpenseCategory> = {
  swiggy: "Food",
  zomato: "Food",
  uber: "Transportation",
  rapido: "Transportation",
  ola: "Transportation",
  amazon: "Shopping",
  flipkart: "Shopping",
  netflix: "Subscriptions",
  spotify: "Subscriptions",
  "reliance smart": "Groceries",
  "reliance fresh": "Groceries",
};
