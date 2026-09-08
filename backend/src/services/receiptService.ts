import { extractTextFromImage } from "./ocrService";
import { parseReceiptText, ParsedReceipt } from "./receiptParser";
import { inferCategory } from "./aiService";
import { ExpenseCategory } from "../config/constants";

export interface ProcessedReceipt extends ParsedReceipt {
  category: ExpenseCategory;
  confidence: number;
  rawText: string;
  receiptUrl: string;
}

function computeConfidence(parsed: ParsedReceipt): number {
  let confidence = 0.3;
  if (parsed.merchant) confidence += 0.2;
  if (parsed.total !== null) confidence += 0.3;
  if (parsed.date) confidence += 0.1;
  if (parsed.lineItems.length > 0) confidence += 0.1;
  return Math.round(Math.min(confidence, 0.95) * 100) / 100;
}

export async function processReceiptImage(
  imageBuffer: Buffer,
  receiptUrl: string
): Promise<ProcessedReceipt> {
  const rawText = await extractTextFromImage(imageBuffer);
  const parsed = parseReceiptText(rawText);
  const category = inferCategory(rawText, parsed.merchant ?? "");
  const confidence = computeConfidence(parsed);

  return {
    ...parsed,
    category,
    confidence,
    rawText,
    receiptUrl,
  };
}
