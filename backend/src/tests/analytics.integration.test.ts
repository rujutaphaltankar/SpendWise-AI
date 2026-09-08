import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../app";

const app = createApp();
let mongo: MongoMemoryServer;
let accessToken: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
  const res = await request(app).post("/api/auth/register").send({
    name: "Rujuta Phaltankar",
    email: `test-${Date.now()}-${Math.random()}@example.com`,
    password: "StrongPass1",
  });
  accessToken = res.body.data.accessToken;
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
});

function auth(req: request.Test) {
  return req.set("Authorization", `Bearer ${accessToken}`);
}

describe("Analytics API", () => {
  it("returns category breakdown with correct percentages", async () => {
    await auth(request(app).post("/api/expenses")).send({
      amount: 600, merchant: "Zomato", category: "Food", date: "2026-08-10",
    });
    await auth(request(app).post("/api/expenses")).send({
      amount: 400, merchant: "Swiggy", category: "Food", date: "2026-08-11",
    });
    await auth(request(app).post("/api/expenses")).send({
      amount: 1000, merchant: "Uber", category: "Transportation", date: "2026-08-12",
    });

    const res = await auth(
      request(app).get("/api/analytics/categories?startDate=2026-08-01&endDate=2026-08-31")
    );

    expect(res.status).toBe(200);
    const food = res.body.data.find((c: any) => c.category === "Food");
    const transport = res.body.data.find((c: any) => c.category === "Transportation");
    expect(food.total).toBe(1000);
    expect(food.count).toBe(2);
    expect(food.percentage).toBe(50);
    expect(transport.percentage).toBe(50);
  });

  it("returns monthly trend with correct income/expense totals per month", async () => {
    await auth(request(app).post("/api/income")).send({
      amount: 25000, source: "salary", date: "2026-08-01",
    });
    await auth(request(app).post("/api/expenses")).send({
      amount: 5000, merchant: "Rent", category: "Rent", date: "2026-08-05",
    });

    const res = await auth(request(app).get("/api/analytics/trends?months=3"));
    expect(res.status).toBe(200);
    expect(res.body.data.monthlyTrend).toHaveLength(3);

    const august = res.body.data.monthlyTrend.find((m: any) => m.month === "2026-08");
    expect(august.totalIncome).toBe(25000);
    expect(august.totalExpenses).toBe(5000);
  });

  it("returns daily spending for the current month", async () => {
    const today = new Date().toISOString().slice(0, 10);
    await auth(request(app).post("/api/expenses")).send({
      amount: 200, merchant: "Coffee", category: "Food", date: today,
    });

    const res = await auth(request(app).get("/api/analytics/trends"));
    expect(res.status).toBe(200);
    expect(res.body.data.dailySpending.length).toBeGreaterThan(0);
    expect(res.body.data.dailySpending[0].total).toBe(200);
  });

  it("returns a summary with top category and biggest transaction", async () => {
    await auth(request(app).post("/api/expenses")).send({
      amount: 5000, merchant: "Big Purchase", category: "Shopping", date: "2026-08-10",
    });
    await auth(request(app).post("/api/expenses")).send({
      amount: 200, merchant: "Small Snack", category: "Food", date: "2026-08-11",
    });

    const res = await auth(
      request(app).get("/api/analytics/summary?startDate=2026-08-01&endDate=2026-08-31")
    );

    expect(res.status).toBe(200);
    expect(res.body.data.topCategory.category).toBe("Shopping");
    expect(res.body.data.biggestTransaction.merchant).toBe("Big Purchase");
    expect(res.body.data.biggestTransaction.amount).toBe(5000);
  });

  it("scopes analytics to the authenticated user only", async () => {
    await auth(request(app).post("/api/expenses")).send({
      amount: 500, merchant: "Mine", category: "Food", date: "2026-08-10",
    });

    const otherUser = await request(app).post("/api/auth/register").send({
      name: "Other User",
      email: `other-${Date.now()}@example.com`,
      password: "StrongPass1",
    });
    const otherToken = otherUser.body.data.accessToken;

    const res = await request(app)
      .get("/api/analytics/categories?startDate=2026-08-01&endDate=2026-08-31")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.body.data).toHaveLength(0);
  });
});
