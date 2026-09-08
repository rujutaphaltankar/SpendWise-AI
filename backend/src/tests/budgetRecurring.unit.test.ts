import { detectRecurringExpenses, ExpenseLike } from "../services/recurringDetectionService";
import { computeBudgetProgress } from "../services/budgetService";

function daysAgo(n: number): Date {
  const d = new Date("2026-08-31");
  d.setDate(d.getDate() - n);
  return d;
}

describe("detectRecurringExpenses — spec example (Netflix)", () => {
  it("flags a monthly Netflix subscription as recurring", () => {
    const expenses: ExpenseLike[] = [
      { merchant: "Netflix", category: "Subscriptions", amount: 649, date: daysAgo(90) },
      { merchant: "Netflix", category: "Subscriptions", amount: 649, date: daysAgo(60) },
      { merchant: "Netflix", category: "Subscriptions", amount: 649, date: daysAgo(30) },
      { merchant: "Netflix", category: "Subscriptions", amount: 649, date: daysAgo(0) },
    ];

    const results = detectRecurringExpenses(expenses);
    expect(results).toHaveLength(1);
    expect(results[0].merchant).toBe("Netflix");
    expect(results[0].averageAmount).toBe(649);
    expect(results[0].intervalDays).toBeGreaterThanOrEqual(28);
    expect(results[0].intervalDays).toBeLessThanOrEqual(32);
    expect(results[0].occurrences).toBe(4);
  });

  it("computes a plausible next expected charge date", () => {
    const expenses: ExpenseLike[] = [
      { merchant: "Spotify", category: "Subscriptions", amount: 119, date: daysAgo(60) },
      { merchant: "Spotify", category: "Subscriptions", amount: 119, date: daysAgo(30) },
      { merchant: "Spotify", category: "Subscriptions", amount: 119, date: daysAgo(0) },
    ];
    const [result] = detectRecurringExpenses(expenses);
    expect(result.nextExpectedDate).toBe("2026-09-30");
  });
});

describe("detectRecurringExpenses — does not flag non-recurring patterns", () => {
  it("does not flag a merchant visited only once", () => {
    const expenses: ExpenseLike[] = [
      { merchant: "Zomato", category: "Food", amount: 450, date: daysAgo(10) },
    ];
    expect(detectRecurringExpenses(expenses)).toHaveLength(0);
  });

  it("does not flag frequent but irregular spending (e.g. random cafe visits)", () => {
    const expenses: ExpenseLike[] = [
      { merchant: "Local Cafe", category: "Food", amount: 150, date: daysAgo(45) },
      { merchant: "Local Cafe", category: "Food", amount: 90, date: daysAgo(20) },
      { merchant: "Local Cafe", category: "Food", amount: 300, date: daysAgo(3) },
    ];
    expect(detectRecurringExpenses(expenses)).toHaveLength(0);
  });

  it("does not flag daily habitual spending as recurring (e.g. every single day)", () => {
    const expenses: ExpenseLike[] = [
      { merchant: "Chai Stall", category: "Food", amount: 20, date: daysAgo(3) },
      { merchant: "Chai Stall", category: "Food", amount: 20, date: daysAgo(2) },
      { merchant: "Chai Stall", category: "Food", amount: 20, date: daysAgo(1) },
      { merchant: "Chai Stall", category: "Food", amount: 20, date: daysAgo(0) },
    ];
    expect(detectRecurringExpenses(expenses)).toHaveLength(0);
  });

  it("does not flag wildly varying amounts even on a regular schedule", () => {
    const expenses: ExpenseLike[] = [
      { merchant: "Random Shop", category: "Shopping", amount: 100, date: daysAgo(60) },
      { merchant: "Random Shop", category: "Shopping", amount: 5000, date: daysAgo(30) },
      { merchant: "Random Shop", category: "Shopping", amount: 200, date: daysAgo(0) },
    ];
    expect(detectRecurringExpenses(expenses)).toHaveLength(0);
  });
});

describe("detectRecurringExpenses — multiple merchants", () => {
  it("detects several independent recurring merchants and sorts by occurrence count", () => {
    const expenses: ExpenseLike[] = [
      { merchant: "Netflix", category: "Subscriptions", amount: 649, date: daysAgo(60) },
      { merchant: "Netflix", category: "Subscriptions", amount: 649, date: daysAgo(30) },
      { merchant: "Netflix", category: "Subscriptions", amount: 649, date: daysAgo(0) },
      { merchant: "Landlord", category: "Rent", amount: 15000, date: daysAgo(60) },
      { merchant: "Landlord", category: "Rent", amount: 15000, date: daysAgo(30) },
      { merchant: "Landlord", category: "Rent", amount: 15000, date: daysAgo(0) },
      { merchant: "Zomato", category: "Food", amount: 300, date: daysAgo(5) },
    ];

    const results = detectRecurringExpenses(expenses);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.merchant).sort()).toEqual(["Landlord", "Netflix"]);
  });
});

describe("computeBudgetProgress", () => {
  it("reports on-track status when well under budget", () => {
    const progress = computeBudgetProgress(
      { id: "1", category: "Food", amount: 5000, thresholds: [50, 75, 90, 100] },
      2000
    );
    expect(progress.percentUsed).toBe(40);
    expect(progress.status).toBe("on-track");
    expect(progress.crossedThresholds).toEqual([]);
  });

  it("reports warning status once a threshold is crossed", () => {
    const progress = computeBudgetProgress(
      { id: "1", category: "Food", amount: 5000, thresholds: [50, 75, 90, 100] },
      4000
    );
    expect(progress.percentUsed).toBe(80);
    expect(progress.status).toBe("warning");
    expect(progress.crossedThresholds).toEqual([50, 75]);
  });

  it("reports exceeded status when spending is at or above 100%", () => {
    const progress = computeBudgetProgress(
      { id: "1", category: "Food", amount: 5000, thresholds: [50, 75, 90, 100] },
      5500
    );
    expect(progress.status).toBe("exceeded");
    expect(progress.remaining).toBe(-500);
    expect(progress.crossedThresholds).toEqual([50, 75, 90, 100]);
  });

  it("handles a zero-amount budget without dividing by zero", () => {
    const progress = computeBudgetProgress(
      { id: "1", category: "Food", amount: 0, thresholds: [50, 75, 90, 100] },
      100
    );
    expect(progress.percentUsed).toBe(0);
  });
});
