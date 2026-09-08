export interface ExpenseLike {
  merchant: string;
  category: string;
  amount: number;
  date: Date;
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

const MIN_OCCURRENCES = 2;
const MIN_INTERVAL_DAYS = 6;
const MAX_INTERVAL_DAYS = 95;
const MAX_INTERVAL_VARIANCE_RATIO = 0.35;
const MAX_AMOUNT_VARIANCE_RATIO = 0.2;

function groupKey(merchant: string, category: string): string {
  return `${merchant.trim().toLowerCase()}::${category}`;
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  if (avg === 0) return 0;
  const variance = mean(values.map((v) => (v - avg) ** 2));
  const stdDev = Math.sqrt(variance);
  return stdDev / avg;
}

export function detectRecurringExpenses(expenses: ExpenseLike[]): RecurringCandidate[] {
  const groups = new Map<string, ExpenseLike[]>();

  for (const expense of expenses) {
    const key = groupKey(expense.merchant, expense.category);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(expense);
  }

  const candidates: RecurringCandidate[] = [];

  for (const group of groups.values()) {
    if (group.length < MIN_OCCURRENCES) continue;

    const sorted = [...group].sort((a, b) => a.date.getTime() - b.date.getTime());
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const gapDays = (sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(gapDays);
    }

    const avgInterval = mean(intervals);
    if (avgInterval < MIN_INTERVAL_DAYS || avgInterval > MAX_INTERVAL_DAYS) continue;

    const intervalVariance = coefficientOfVariation(intervals);
    if (intervalVariance > MAX_INTERVAL_VARIANCE_RATIO) continue;

    const amounts = sorted.map((e) => e.amount);
    const amountVariance = coefficientOfVariation(amounts);
    if (amountVariance > MAX_AMOUNT_VARIANCE_RATIO) continue;

    const last = sorted[sorted.length - 1];
    const nextExpected = new Date(last.date);
    nextExpected.setDate(nextExpected.getDate() + Math.round(avgInterval));

    candidates.push({
      merchant: last.merchant,
      category: last.category,
      averageAmount: Math.round(mean(amounts) * 100) / 100,
      intervalDays: Math.round(avgInterval),
      occurrences: sorted.length,
      lastDate: last.date.toISOString().slice(0, 10),
      nextExpectedDate: nextExpected.toISOString().slice(0, 10),
    });
  }

  return candidates.sort((a, b) => b.occurrences - a.occurrences);
}
