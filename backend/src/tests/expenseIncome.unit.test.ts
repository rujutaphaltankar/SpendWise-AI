import { computeFinancialSummary } from "../services/incomeService";
import { createExpenseSchema, listExpensesQuerySchema } from "../validators/expenseValidators";
import { createIncomeSchema } from "../validators/incomeValidators";

describe("computeFinancialSummary", () => {
  it("computes balance and savings rate correctly", () => {
    const start = new Date("2026-08-01");
    const end = new Date("2026-08-31");
    const summary = computeFinancialSummary(25000, 18000, start, end);

    expect(summary.totalIncome).toBe(25000);
    expect(summary.totalExpenses).toBe(18000);
    expect(summary.availableBalance).toBe(7000);
    expect(summary.savingsRate).toBe(28); // 7000/25000 * 100
  });

  it("handles zero income without dividing by zero", () => {
    const summary = computeFinancialSummary(0, 500, new Date(), new Date());
    expect(summary.savingsRate).toBe(0);
    expect(summary.availableBalance).toBe(-500);
  });

  it("rounds savings rate to 1 decimal place", () => {
    const summary = computeFinancialSummary(3000, 1000, new Date(), new Date());
    // (2000/3000)*100 = 66.666...
    expect(summary.savingsRate).toBe(66.7);
  });

  it("handles negative balance (overspending) correctly", () => {
    const summary = computeFinancialSummary(10000, 15000, new Date(), new Date());
    expect(summary.availableBalance).toBe(-5000);
    expect(summary.savingsRate).toBe(-50);
  });
});

describe("createExpenseSchema", () => {
  it("accepts a valid manual expense", () => {
    const result = createExpenseSchema.safeParse({
      amount: 450,
      merchant: "Zomato",
      category: "Food",
      date: "2026-08-20",
      paymentMethod: "UPI",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a zero or negative amount", () => {
    expect(
      createExpenseSchema.safeParse({
        amount: 0,
        merchant: "Zomato",
        category: "Food",
        date: "2026-08-20",
      }).success
    ).toBe(false);

    expect(
      createExpenseSchema.safeParse({
        amount: -50,
        merchant: "Zomato",
        category: "Food",
        date: "2026-08-20",
      }).success
    ).toBe(false);
  });

  it("rejects an invalid category not in the allowed enum", () => {
    const result = createExpenseSchema.safeParse({
      amount: 100,
      merchant: "Random Shop",
      category: "NotACategory",
      date: "2026-08-20",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid payment method", () => {
    const result = createExpenseSchema.safeParse({
      amount: 100,
      merchant: "Shop",
      category: "Other",
      date: "2026-08-20",
      paymentMethod: "Crypto",
    });
    expect(result.success).toBe(false);
  });
});

describe("listExpensesQuerySchema", () => {
  it("applies default pagination and sort values", () => {
    const result = listExpensesQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sortBy).toBe("date");
      expect(result.data.sortOrder).toBe("desc");
    }
  });

  it("coerces isRecurring string 'true' to boolean true", () => {
    const result = listExpensesQuerySchema.safeParse({ isRecurring: "true" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isRecurring).toBe(true);
    }
  });

  it("rejects a limit above the max of 100", () => {
    const result = listExpensesQuerySchema.safeParse({ limit: "500" });
    expect(result.success).toBe(false);
  });
});

describe("createIncomeSchema", () => {
  it("accepts a valid income entry", () => {
    const result = createIncomeSchema.safeParse({
      amount: 25000,
      source: "salary",
      date: "2026-08-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unrecognized income source", () => {
    const result = createIncomeSchema.safeParse({
      amount: 25000,
      source: "lottery",
      date: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });
});
