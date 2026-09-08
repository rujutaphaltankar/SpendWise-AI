import { parseReceiptText } from "../services/receiptParser";
import { inferCategory } from "../services/aiService";

describe("receipt categorization (spec example)", () => {
  it("categorizes a Reliance Smart receipt as Groceries via the merchant map", () => {
    const text = "Reliance Smart\n21 Aug 2026\nMilk 68\nBread 45\nTotal 823";
    const parsed = parseReceiptText(text);
    const category = inferCategory(text, parsed.merchant ?? "");
    expect(category).toBe("Groceries");
  });

  it("categorizes a receipt with explicit grocery keyword", () => {
    const text = "Local Grocery Store\nMilk 68\nTotal 68";
    const parsed = parseReceiptText(text);
    const category = inferCategory(text, parsed.merchant ?? "");
    expect(category).toBe("Groceries");
  });

  it("falls back to Other for an unrecognized merchant with no keywords", () => {
    const text = "XYZ Corner Shop\nItem 100\nTotal 100";
    const parsed = parseReceiptText(text);
    const category = inferCategory(text, parsed.merchant ?? "");
    expect(category).toBe("Other");
  });
});
