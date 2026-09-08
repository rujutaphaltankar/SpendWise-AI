import { buildMonthBuckets, computeMonthComparison } from "../services/analyticsService";

describe("buildMonthBuckets", () => {
  it("builds the requested number of consecutive month buckets ending at referenceDate's month", () => {
    const reference = new Date("2026-08-15");
    const buckets = buildMonthBuckets(3, reference);

    expect(buckets).toHaveLength(3);
    expect(buckets.map((b) => b.label)).toEqual(["2026-06", "2026-07", "2026-08"]);
  });

  it("each bucket spans the full calendar month (start to end)", () => {
    const reference = new Date("2026-08-15");
    const buckets = buildMonthBuckets(1, reference);
    const [aug] = buckets;

    expect(aug.start.getDate()).toBe(1);
    expect(aug.start.getMonth()).toBe(7); // August = index 7
    expect(aug.end.getMonth()).toBe(7);
    expect(aug.end.getDate()).toBe(31);
  });

  it("correctly rolls back across a year boundary", () => {
    const reference = new Date("2026-01-15");
    const buckets = buildMonthBuckets(3, reference);
    expect(buckets.map((b) => b.label)).toEqual(["2025-11", "2025-12", "2026-01"]);
  });

  it("handles a single-month request", () => {
    const reference = new Date("2026-08-15");
    const buckets = buildMonthBuckets(1, reference);
    expect(buckets).toHaveLength(1);
    expect(buckets[0].label).toBe("2026-08");
  });
});

describe("computeMonthComparison", () => {
  it("computes a positive change when spending increased", () => {
    const result = computeMonthComparison(6000, 5000);
    expect(result.changeAmount).toBe(1000);
    expect(result.changePercent).toBe(20);
  });

  it("computes a negative change when spending decreased", () => {
    const result = computeMonthComparison(4000, 5000);
    expect(result.changeAmount).toBe(-1000);
    expect(result.changePercent).toBe(-20);
  });

  it("returns null percent change when the previous month had zero spending", () => {
    const result = computeMonthComparison(2000, 0);
    expect(result.changePercent).toBeNull();
    expect(result.changeAmount).toBe(2000);
  });

  it("handles both months being zero", () => {
    const result = computeMonthComparison(0, 0);
    expect(result.changeAmount).toBe(0);
    expect(result.changePercent).toBeNull();
  });
});
