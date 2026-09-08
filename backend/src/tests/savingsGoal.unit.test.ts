import { computeSavingsGoalProgress } from "../services/savingsGoalService";

describe("computeSavingsGoalProgress — spec example (laptop, ₹28,000 of ₹70,000)", () => {
  it("computes 40% progress exactly as in the spec example", () => {
    const progress = computeSavingsGoalProgress({
      id: "1", name: "Laptop", targetAmount: 70000, currentAmount: 28000, targetDate: null,
    });
    expect(progress.progressPercent).toBe(40);
    expect(progress.isComplete).toBe(false);
  });
});

describe("computeSavingsGoalProgress — required monthly savings", () => {
  it("computes required monthly savings toward a future target date", () => {
    const today = new Date("2026-08-01");
    const targetDate = new Date("2027-02-01");
    const progress = computeSavingsGoalProgress(
      { id: "1", name: "Laptop", targetAmount: 70000, currentAmount: 28000, targetDate },
      today
    );
    expect(progress.requiredMonthlySavings).toBe(7000);
  });

  it("returns null required savings when there is no target date", () => {
    const progress = computeSavingsGoalProgress({
      id: "1", name: "Laptop", targetAmount: 70000, currentAmount: 28000, targetDate: null,
    });
    expect(progress.requiredMonthlySavings).toBeNull();
  });

  it("marks the goal complete when current amount meets or exceeds the target", () => {
    const progress = computeSavingsGoalProgress({
      id: "1", name: "Laptop", targetAmount: 70000, currentAmount: 70000, targetDate: null,
    });
    expect(progress.isComplete).toBe(true);
    expect(progress.requiredMonthlySavings).toBeNull();
  });

  it("handles a target date in the past by treating it as due now (1 month minimum)", () => {
    const today = new Date("2026-08-01");
    const targetDate = new Date("2026-01-01");
    const progress = computeSavingsGoalProgress(
      { id: "1", name: "Laptop", targetAmount: 70000, currentAmount: 28000, targetDate },
      today
    );
    expect(progress.requiredMonthlySavings).toBe(42000);
  });
});
