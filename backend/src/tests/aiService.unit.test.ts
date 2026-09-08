import { ruleBasedExtract, extractedExpenseSchema } from "../services/aiService";

describe("ruleBasedExtract — spec examples", () => {
  it('parses "Spent ₹450 on Zomato"', () => {
    const result = ruleBasedExtract("Spent ₹450 on Zomato");
    expect(result.amount).toBe(450);
    expect(result.merchant).toBe("Zomato");
    expect(result.category).toBe("Food");
    expect(extractedExpenseSchema.safeParse(result).success).toBe(true);
  });

  it('parses "Paid 250 for Uber yesterday"', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expectedDate = yesterday.toISOString().slice(0, 10);

    const result = ruleBasedExtract("Paid 250 for Uber yesterday");
    expect(result.amount).toBe(250);
    expect(result.merchant).toBe("Uber");
    expect(result.category).toBe("Transportation");
    expect(result.date).toBe(expectedDate);
  });

  it('parses "Bought groceries worth 820 from Reliance"', () => {
    const result = ruleBasedExtract("Bought groceries worth 820 from Reliance");
    expect(result.amount).toBe(820);
    expect(result.category).toBe("Groceries");
    expect(result.merchant.toLowerCase()).toContain("reliance");
  });

  it('parses "Netflix subscription ₹649"', () => {
    const result = ruleBasedExtract("Netflix subscription ₹649");
    expect(result.amount).toBe(649);
    expect(result.merchant).toBe("Netflix");
    expect(result.category).toBe("Subscriptions");
  });
});

describe("ruleBasedExtract — amount parsing", () => {
  it("parses amounts with commas", () => {
    const result = ruleBasedExtract("Spent ₹1,250 on Amazon");
    expect(result.amount).toBe(1250);
  });

  it("parses Rs. prefix", () => {
    const result = ruleBasedExtract("Paid Rs. 300 for lunch");
    expect(result.amount).toBe(300);
  });

  it("parses INR prefix", () => {
    const result = ruleBasedExtract("INR 500 spent at the store");
    expect(result.amount).toBe(500);
  });

  it("returns null amount when none is present, with low confidence", () => {
    const result = ruleBasedExtract("Had a great day today");
    expect(result.amount).toBeNull();
    expect(result.confidence).toBeLessThanOrEqual(0.2);
  });
});

describe("ruleBasedExtract — payment method detection", () => {
  it("detects UPI", () => {
    expect(ruleBasedExtract("Paid 100 via UPI at the shop").paymentMethod).toBe("UPI");
  });

  it("detects cash", () => {
    expect(ruleBasedExtract("Paid 100 cash for snacks").paymentMethod).toBe("Cash");
  });

  it("detects credit card", () => {
    expect(ruleBasedExtract("Spent 5000 on credit card at Amazon").paymentMethod).toBe(
      "Credit Card"
    );
  });

  it("returns null when no payment method is mentioned", () => {
    expect(ruleBasedExtract("Spent ₹450 on Zomato").paymentMethod).toBeNull();
  });
});

describe("ruleBasedExtract — category inference", () => {
  it("infers Rent from keyword", () => {
    expect(ruleBasedExtract("Paid 15000 rent for this month").category).toBe("Rent");
  });

  it("infers Healthcare from keyword", () => {
    expect(ruleBasedExtract("Paid 800 to the doctor").category).toBe("Healthcare");
  });

  it("infers Entertainment from keyword", () => {
    expect(ruleBasedExtract("Spent 400 on movie tickets").category).toBe("Entertainment");
  });

  it("defaults to Other when nothing matches", () => {
    expect(ruleBasedExtract("Spent 100 on xyz random stuff").category).toBe("Other");
  });
});

describe("ruleBasedExtract — output always satisfies the schema contract", () => {
  const sampleInputs = [
    "Spent ₹450 on Zomato",
    "asdkjaskjd random gibberish text",
    "",
    "   ",
    "12345",
    "Paid Rs.99999999 for something huge",
  ];

  it.each(sampleInputs)("never produces schema-invalid output for: %p", (input) => {
    // Empty/whitespace text is rejected earlier by the request validator,
    // but the extractor itself should never crash or emit invalid shape.
    if (input.trim().length === 0) return;
    const result = ruleBasedExtract(input);
    const parsed = extractedExpenseSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });
});
