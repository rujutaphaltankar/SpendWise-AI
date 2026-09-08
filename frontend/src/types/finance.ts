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

export const PAYMENT_METHODS = [
  "UPI",
  "Cash",
  "Debit Card",
  "Credit Card",
  "Bank Transfer",
] as const;

export const INCOME_SOURCES = ["salary", "freelance", "allowance", "scholarship", "other"] as const;

export interface Expense {
  _id: string;
  amount: number;
  merchant: string;
  category: string;
  subcategory?: string;
  date: string;
  paymentMethod?: string;
  description?: string;
  source: string;
  aiCategorized: boolean;
  aiConfidence?: number;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  _id: string;
  amount: number;
  source: string;
  description?: string;
  date: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  availableBalance: number;
  savingsRate: number;
  periodStart: string;
  periodEnd: string;
}

export interface CategoryBreakdownItem {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlyTrendItem {
  month: string;
  totalIncome: number;
  totalExpenses: number;
}

export interface DailySpendingItem {
  date: string;
  total: number;
}

export interface MonthComparison {
  currentMonthTotal: number;
  previousMonthTotal: number;
  changeAmount: number;
  changePercent: number | null;
}

export interface AnalyticsSummary extends FinancialSummary {
  topCategory: { category: string; total: number } | null;
  biggestTransaction: { merchant: string; amount: number; category: string; date: string } | null;
  monthComparison: MonthComparison;
}

export interface Budget {
  _id: string;
  category: string | null;
  amount: number;
  thresholds: number[];
}

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

export interface SavingsGoalProgress {
  goalId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
  targetDate: string | null;
  requiredMonthlySavings: number | null;
  isComplete: boolean;
}

export interface RecurringCandidate {
  merchant: string;
  category: string;
  averageAmount: number;
  intervalDays: number;
  occurrences: number;
  lastDate: string;
  nextExpectedDate: string;
}

export interface PredictionResult {
  predictedAmount: number;
  confidenceRange: { lower: number; upper: number };
  model: string;
  dataPointsUsed: number;
  method: string;
}

export interface CategoryForecast {
  category: string;
  currentMonth: number;
  previousMonth: number;
  averageOfLast3Months: number;
  projected: number;
}

export interface AnomalyResult {
  id: string;
  amount: number;
  category: string;
  date: string;
  reason: string;
  score: number;
}

export interface InsightResponse {
  facts: Record<string, unknown>;
  explanation: string;
  generatedBy: "ai" | "template";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
