import { parseReceiptText } from "../services/receiptParser";

describe("parseReceiptText — spec example", () => {
  const receiptText = `
Reliance Smart
21 Aug 2026

Milk 68
Bread 45
Vegetables 220
Snacks 90

Subtotal 423
GST 18.00
Total 823
`;

  it("extracts the merchant name", () => {
    expect(parseReceiptText(receiptText).merchant).toBe("Reliance Smart");
  });

  it("extracts the date", () => {
    expect(parseReceiptText(receiptText).date).toBe("2026-08-21");
  });

  it("extracts the total (not the subtotal)", () => {
    expect(parseReceiptText(receiptText).total).toBe(823);
  });

  it("extracts all four line items with correct prices", () => {
    const { lineItems } = parseReceiptText(receiptText);
    expect(lineItems).toHaveLength(4);
    expect(lineItems).toEqual(
      expect.arrayContaining([
        { name: "Milk", price: 68 },
        { name: "Bread", price: 45 },
        { name: "Vegetables", price: 220 },
        { name: "Snacks", price: 90 },
      ])
    );
  });

  it("does not include GST/subtotal/total lines as line items", () => {
    const { lineItems } = parseReceiptText(receiptText);
    const names = lineItems.map((i) => i.name.toLowerCase());
    expect(names).not.toContain("gst");
    expect(names).not.toContain("subtotal");
    expect(names).not.toContain("total");
  });
});

describe("parseReceiptText — date format variations", () => {
  it("parses dd/mm/yyyy", () => {
    expect(parseReceiptText("Store\n20/08/2026\nTotal 500").date).toBe("2026-08-20");
  });

  it("parses dd-mm-yyyy", () => {
    expect(parseReceiptText("Store\n05-01-2026\nTotal 500").date).toBe("2026-01-05");
  });

  it("parses ISO yyyy-mm-dd", () => {
    expect(parseReceiptText("Store\n2026-08-20\nTotal 500").date).toBe("2026-08-20");
  });

  it("parses full month names", () => {
    expect(parseReceiptText("Store\n3 September 2026\nTotal 500").date).toBe("2026-09-03");
  });

  it("returns null when no date is present", () => {
    expect(parseReceiptText("Store\nTotal 500").date).toBeNull();
  });
});

describe("parseReceiptText — total extraction priority", () => {
  it("prefers 'Grand Total' over 'Total' and 'Subtotal'", () => {
    const text = "Store\nSubtotal 400\nTotal 450\nGrand Total 470";
    expect(parseReceiptText(text).total).toBe(470);
  });

  it("never picks subtotal as the total when a real total exists", () => {
    const text = "Store\nSubtotal 400\nTax 50\nTotal 450";
    expect(parseReceiptText(text).total).toBe(450);
  });

  it("returns null when no total-like line exists", () => {
    const text = "Store\nMilk 68\nBread 45";
    expect(parseReceiptText(text).total).toBeNull();
  });

  it("handles currency symbols and commas in the total", () => {
    const text = "Store\nTotal: ₹1,250.50";
    expect(parseReceiptText(text).total).toBe(1250.5);
  });
});

describe("parseReceiptText — merchant extraction", () => {
  it("picks the first non-trivial line as the merchant", () => {
    expect(parseReceiptText("Swiggy\nOrder #1234\nTotal 300").merchant).toBe("Swiggy");
  });

  it("skips a leading date line when picking the merchant", () => {
    expect(parseReceiptText("21/08/2026\nBigBasket\nTotal 300").merchant).toBe("BigBasket");
  });

  it("returns null merchant for a receipt with no usable header line", () => {
    expect(parseReceiptText("21/08/2026\n123").merchant).toBeNull();
  });
});

describe("parseReceiptText — robustness", () => {
  it("does not throw on empty input", () => {
    expect(() => parseReceiptText("")).not.toThrow();
    const result = parseReceiptText("");
    expect(result.merchant).toBeNull();
    expect(result.total).toBeNull();
    expect(result.lineItems).toEqual([]);
  });

  it("does not throw on garbled OCR noise", () => {
    expect(() => parseReceiptText("###$$$ %%% \n\n   \t asdkj812903")).not.toThrow();
  });

  it("ignores standalone numeric lines (e.g. phone/invoice numbers) as line items", () => {
    const text = "Store\nInvoice: 9988776655\nMilk 68\nTotal 68";
    const { lineItems } = parseReceiptText(text);
    expect(lineItems.map((i) => i.name)).not.toContain("9988776655");
  });
});
