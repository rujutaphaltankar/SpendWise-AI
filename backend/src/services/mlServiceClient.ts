import { env } from "../config/env";

export interface MonthlyDataPoint {
  month: string;
  total: number;
}

export interface PredictionResult {
  predictedAmount: number;
  confidenceRange: { lower: number; upper: number };
  model: string;
  dataPointsUsed: number;
  method: string;
}

export interface TransactionPoint {
  id: string;
  amount: number;
  category: string;
  date: string;
}

export interface AnomalyResult {
  id: string;
  amount: number;
  category: string;
  date: string;
  reason: string;
  score: number;
}

export interface AnomalyDetectionResult {
  anomalies: AnomalyResult[];
  method: string;
  transactionsAnalyzed: number;
}

const REQUEST_TIMEOUT_MS = 8000;

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.mlServiceUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`ML service returned ${response.status}: ${errorBody}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function predictMonthlySpending(monthlyHistory: MonthlyDataPoint[]): Promise<PredictionResult> {
  return postJson<PredictionResult>("/predict/monthly-spending", { monthly_history: monthlyHistory });
}

export async function detectAnomalies(
  transactions: TransactionPoint[],
  method: "zscore" | "iqr" = "zscore"
): Promise<AnomalyDetectionResult> {
  return postJson<AnomalyDetectionResult>("/detect/anomalies", { transactions, method });
}
