// Pure, deterministic parsing of raw OCR text into structured receipt data.
// Deliberately separated from the OCR engine itself (services/ocrService.ts)
// so this — the part with real, auditable logic — is fully unit-testable
// without needing an OCR engine or any network access.

export interface ParsedLineItem {
  name: string;
  price: number;
}

export interface ParsedReceipt {
  merchant: string | null;
  date: string | null; // ISO yyyy-mm-dd
  total: number | null;
  lineItems: ParsedLineItem[];
}

const TOTAL_LINE_PATTERNS = [
  /grand\s*total/i,
  /^total\b/i,
  /total\s*amount/i,
  /amount\s*due/i,
  /net\s*amount/i,
  /bill\s*amount/i,
];

const NON_ITEM_KEYWORDS =
  /\b(total|subtotal|sub-total|tax|gst|cgst|sgst|vat|amount|balance|change|cash|card|invoice|receipt|bill\s*no|thank you|welcome|phone|address|gstin|table|order)\b/i;

const MONTH_NAMES =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

function extractNumber(fragment: string): number | null {
  const match = fragment.match(/([\d,]+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const value = parseFloat(match[1].replace(/,/g, ""));
  return isNaN(value) ? null : value;
}

function extractTotal(lines: string[]): number | null {
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (/subtotal|sub-total/i.test(line)) continue;
    if (TOTAL_LINE_PATTERNS.some((p) => p.test(line))) {
      const value = extractNumber(line);
      if (value !== null) return value;
    }
  }
  return null;
}

function extractDate(text: string): string | null {
  const slashMatch = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (slashMatch) {
    let [, day, month, year] = slashMatch;
    if (year.length === 2) year = `20${year}`;
    const iso = toIsoDate(parseInt(year), parseInt(month), parseInt(day));
    if (iso) return iso;
  }

  const monthNameMatch = text.match(
    new RegExp(`\\b(\\d{1,2})\\s+(${MONTH_NAMES})[a-z]*\\.?\\s+(\\d{4})\\b`, "i")
  );
  if (monthNameMatch) {
    const [, day, monthName, year] = monthNameMatch;
    const month = monthNameToNumber(monthName);
    if (month) {
      const iso = toIsoDate(parseInt(year), month, parseInt(day));
      if (iso) return iso;
    }
  }

  const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const iso = toIsoDate(parseInt(year), parseInt(month), parseInt(day));
    if (iso) return iso;
  }

  return null;
}

function monthNameToNumber(name: string): number | null {
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const index = months.findIndex((m) => name.toLowerCase().startsWith(m));
  return index === -1 ? null : index + 1;
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function extractLineItems(lines: string[]): ParsedLineItem[] {
  const items: ParsedLineItem[] = [];
  const itemPattern = /^(.+?)[\s.\-—:]{1,}(?:₹|rs\.?)?\s?([\d,]+(?:\.\d{1,2})?)\s*$/i;

  for (const line of lines) {
    if (NON_ITEM_KEYWORDS.test(line)) continue;
    if (/^\d+$/.test(line.trim())) continue;
    if (extractDate(line)) continue;

    const match = line.match(itemPattern);
    if (!match) continue;

    const name = match[1].trim().replace(/[.\-—:]+$/, "").trim();
    const price = extractNumber(match[2]);

    if (name.length > 0 && price !== null && price > 0) {
      items.push({ name, price });
    }
  }

  return items;
}

function extractMerchant(lines: string[]): string | null {
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 2) continue;
    if (/^\d+$/.test(trimmed)) continue;
    if (extractDate(trimmed)) continue;
    return trimmed;
  }
  return null;
}

export function parseReceiptText(rawText: string): ParsedReceipt {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return {
    merchant: extractMerchant(lines),
    date: extractDate(rawText),
    total: extractTotal(lines),
    lineItems: extractLineItems(lines),
  };
}
