/**
 * Demo data seed script (spec section 30).
 *
 * Generates ~6 months of realistic-looking activity for a single demo
 * account so the dashboard, analytics, predictions, and recurring/anomaly
 * detection all have something meaningful to show immediately after setup.
 *
 * IMPORTANT: this is synthetic demo data, clearly scoped to one fixed
 * demo account (demo@spendwise.ai) — never presented as real user data.
 *
 * Run with: npm run seed
 */
import { connectDB, disconnectDB } from "../config/db";
import { User } from "../models/User";
import { Expense } from "../models/Expense";
import { Income } from "../models/Income";
import { Budget } from "../models/Budget";
import { SavingsGoal } from "../models/SavingsGoal";

const DEMO_EMAIL = "demo@spendwise.ai";
const DEMO_PASSWORD = "Demo@1234";

// Simple deterministic PRNG (mulberry32) so re-running the seed produces
// the same-shaped demo data every time, rather than a different random
// dataset on every run.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

function randomBetween(min: number, max: number): number {
  return Math.round(min + rand() * (max - min));
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

const FOOD_MERCHANTS = ["Zomato", "Swiggy", "Local Cafe", "Starbucks"];
const SHOPPING_MERCHANTS = ["Amazon", "Flipkart", "Myntra"];
const TRANSPORT_MERCHANTS = ["Uber", "Ola", "Rapido"];
const GROCERY_MERCHANTS = ["Reliance Smart", "BigBasket", "D-Mart"];

async function seed() {
  await connectDB();

  console.log("[seed] Clearing existing demo data...");
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    await Promise.all([
      Expense.deleteMany({ userId: existing._id }),
      Income.deleteMany({ userId: existing._id }),
      Budget.deleteMany({ userId: existing._id }),
      SavingsGoal.deleteMany({ userId: existing._id }),
      User.deleteOne({ _id: existing._id }),
    ]);
  }

  console.log("[seed] Creating demo user...");
  const user = await User.create({
    name: "Demo User",
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    currency: "INR",
    monthlyIncome: 28000,
    savingsGoalAmount: 70000,
  });

  const MONTHS_BACK = 6;
  const today = new Date();
  const monthStarts: Date[] = [];
  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    monthStarts.push(new Date(today.getFullYear(), today.getMonth() - i, 1));
  }

  console.log("[seed] Creating income records...");
  for (const monthStart of monthStarts) {
    await Income.create({
      userId: user._id,
      amount: randomBetween(26000, 29000),
      source: "salary",
      description: "Monthly salary",
      date: new Date(monthStart.getFullYear(), monthStart.getMonth(), 1),
    });
  }

  console.log("[seed] Creating recurring subscriptions and rent...");
  for (const monthStart of monthStarts) {
    await Expense.create({
      userId: user._id,
      amount: 649,
      merchant: "Netflix",
      category: "Subscriptions",
      date: new Date(monthStart.getFullYear(), monthStart.getMonth(), 5),
      paymentMethod: "Credit Card",
      source: "manual",
      isRecurring: true,
    });
    await Expense.create({
      userId: user._id,
      amount: 119,
      merchant: "Spotify",
      category: "Subscriptions",
      date: new Date(monthStart.getFullYear(), monthStart.getMonth(), 7),
      paymentMethod: "Credit Card",
      source: "manual",
      isRecurring: true,
    });
    await Expense.create({
      userId: user._id,
      amount: 12000,
      merchant: "Landlord",
      category: "Rent",
      date: new Date(monthStart.getFullYear(), monthStart.getMonth(), 1),
      paymentMethod: "Bank Transfer",
      source: "manual",
      isRecurring: true,
    });
  }

  console.log("[seed] Creating everyday variable expenses...");
  for (const monthStart of monthStarts) {
    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();

    // ~10-14 food expenses per month
    for (let i = 0; i < randomBetween(10, 14); i++) {
      await Expense.create({
        userId: user._id,
        amount: randomBetween(150, 600),
        merchant: pick(FOOD_MERCHANTS),
        category: "Food",
        date: new Date(monthStart.getFullYear(), monthStart.getMonth(), randomBetween(1, daysInMonth)),
        paymentMethod: pick(["UPI", "Cash", "Debit Card"] as const),
        source: "manual",
      });
    }

    // ~4-6 grocery trips
    for (let i = 0; i < randomBetween(4, 6); i++) {
      await Expense.create({
        userId: user._id,
        amount: randomBetween(400, 900),
        merchant: pick(GROCERY_MERCHANTS),
        category: "Groceries",
        date: new Date(monthStart.getFullYear(), monthStart.getMonth(), randomBetween(1, daysInMonth)),
        paymentMethod: pick(["UPI", "Cash"] as const),
        source: "manual",
      });
    }

    // ~6-10 transport rides
    for (let i = 0; i < randomBetween(6, 10); i++) {
      await Expense.create({
        userId: user._id,
        amount: randomBetween(80, 350),
        merchant: pick(TRANSPORT_MERCHANTS),
        category: "Transportation",
        date: new Date(monthStart.getFullYear(), monthStart.getMonth(), randomBetween(1, daysInMonth)),
        paymentMethod: "UPI",
        source: "manual",
      });
    }

    // ~2-4 shopping purchases
    for (let i = 0; i < randomBetween(2, 4); i++) {
      await Expense.create({
        userId: user._id,
        amount: randomBetween(300, 1500),
        merchant: pick(SHOPPING_MERCHANTS),
        category: "Shopping",
        date: new Date(monthStart.getFullYear(), monthStart.getMonth(), randomBetween(1, daysInMonth)),
        paymentMethod: "Credit Card",
        source: "manual",
      });
    }

    // 1 entertainment + 1 personal care per month
    await Expense.create({
      userId: user._id,
      amount: randomBetween(300, 700),
      merchant: "PVR Cinemas",
      category: "Entertainment",
      date: new Date(monthStart.getFullYear(), monthStart.getMonth(), randomBetween(1, daysInMonth)),
      paymentMethod: "UPI",
      source: "manual",
    });
    await Expense.create({
      userId: user._id,
      amount: randomBetween(200, 500),
      merchant: "Local Salon",
      category: "Personal Care",
      date: new Date(monthStart.getFullYear(), monthStart.getMonth(), randomBetween(1, daysInMonth)),
      paymentMethod: "Cash",
      source: "manual",
    });
  }

  console.log("[seed] Injecting a couple of anomalies...");
  const anomalyMonth = monthStarts[monthStarts.length - 2];
  await Expense.create({
    userId: user._id,
    amount: 8500,
    merchant: "Amazon",
    category: "Shopping",
    date: new Date(anomalyMonth.getFullYear(), anomalyMonth.getMonth(), 18),
    paymentMethod: "Credit Card",
    source: "manual",
    description: "Unusually large electronics purchase",
  });
  await Expense.create({
    userId: user._id,
    amount: 4200,
    merchant: "Apollo Pharmacy",
    category: "Healthcare",
    date: new Date(anomalyMonth.getFullYear(), anomalyMonth.getMonth(), 22),
    paymentMethod: "Cash",
    source: "manual",
    description: "Unplanned medical expense",
  });

  console.log("[seed] Creating budgets...");
  await Budget.create({ userId: user._id, category: null, amount: 30000, thresholds: [50, 75, 90, 100] });
  await Budget.create({ userId: user._id, category: "Food", amount: 6000, thresholds: [50, 75, 90, 100] });
  await Budget.create({ userId: user._id, category: "Shopping", amount: 4000, thresholds: [50, 75, 90, 100] });

  console.log("[seed] Creating a savings goal...");
  const targetDate = new Date(today.getFullYear(), today.getMonth() + 6, 1);
  await SavingsGoal.create({
    userId: user._id,
    name: "Laptop",
    targetAmount: 70000,
    currentAmount: 28000,
    targetDate,
  });

  console.log("\n=== Demo data seeded successfully ===");
  console.log(`Login with:\n  Email:    ${DEMO_EMAIL}\n  Password: ${DEMO_PASSWORD}`);
  console.log("This is synthetic demo data — not real financial data.\n");

  await disconnectDB();
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
