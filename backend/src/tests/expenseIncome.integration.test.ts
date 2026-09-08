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

describe("Expense API", () => {
  it("creates an expense", async () => {
    const res = await auth(request(app).post("/api/expenses")).send({
      amount: 450,
      merchant: "Zomato",
      category: "Food",
      date: "2026-08-20",
      paymentMethod: "UPI",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.merchant).toBe("Zomato");
    expect(res.body.data.amount).toBe(450);
  });

  it("rejects an expense with an invalid category", async () => {
    const res = await auth(request(app).post("/api/expenses")).send({
      amount: 100,
      merchant: "Random",
      category: "NotReal",
      date: "2026-08-20",
    });
    expect(res.status).toBe(400);
  });

  it("blocks expense creation without auth", async () => {
    const res = await request(app).post("/api/expenses").send({
      amount: 100,
      merchant: "Random",
      category: "Food",
      date: "2026-08-20",
    });
    expect(res.status).toBe(401);
  });

  it("lists, filters by category, and paginates expenses", async () => {
    await auth(request(app).post("/api/expenses")).send({
      amount: 450, merchant: "Zomato", category: "Food", date: "2026-08-20",
    });
    await auth(request(app).post("/api/expenses")).send({
      amount: 250, merchant: "Uber", category: "Transportation", date: "2026-08-19",
    });
    await auth(request(app).post("/api/expenses")).send({
      amount: 820, merchant: "Reliance Smart", category: "Groceries", date: "2026-08-18",
    });

    const all = await auth(request(app).get("/api/expenses"));
    expect(all.status).toBe(200);
    expect(all.body.data.total).toBe(3);

    const foodOnly = await auth(request(app).get("/api/expenses?category=Food"));
    expect(foodOnly.body.data.total).toBe(1);
    expect(foodOnly.body.data.items[0].merchant).toBe("Zomato");
  });

  it("searches expenses by merchant text", async () => {
    await auth(request(app).post("/api/expenses")).send({
      amount: 450, merchant: "Zomato", category: "Food", date: "2026-08-20",
    });
    await auth(request(app).post("/api/expenses")).send({
      amount: 250, merchant: "Uber", category: "Transportation", date: "2026-08-19",
    });

    const res = await auth(request(app).get("/api/expenses?search=zoma"));
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0].merchant).toBe("Zomato");
  });

  it("filters expenses by date range", async () => {
    await auth(request(app).post("/api/expenses")).send({
      amount: 100, merchant: "A", category: "Other", date: "2026-08-01",
    });
    await auth(request(app).post("/api/expenses")).send({
      amount: 100, merchant: "B", category: "Other", date: "2026-08-15",
    });
    await auth(request(app).post("/api/expenses")).send({
      amount: 100, merchant: "C", category: "Other", date: "2026-08-30",
    });

    const res = await auth(
      request(app).get("/api/expenses?startDate=2026-08-10&endDate=2026-08-20")
    );
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0].merchant).toBe("B");
  });

  it("updates an expense", async () => {
    const create = await auth(request(app).post("/api/expenses")).send({
      amount: 450, merchant: "Zomato", category: "Food", date: "2026-08-20",
    });
    const id = create.body.data._id;

    const res = await auth(request(app).put(`/api/expenses/${id}`)).send({ amount: 500 });
    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(500);
  });

  it("deletes an expense", async () => {
    const create = await auth(request(app).post("/api/expenses")).send({
      amount: 450, merchant: "Zomato", category: "Food", date: "2026-08-20",
    });
    const id = create.body.data._id;

    const del = await auth(request(app).delete(`/api/expenses/${id}`));
    expect(del.status).toBe(200);

    const get = await auth(request(app).get(`/api/expenses/${id}`));
    expect(get.status).toBe(404);
  });

  it("never returns another user's expenses", async () => {
    await auth(request(app).post("/api/expenses")).send({
      amount: 450, merchant: "Zomato", category: "Food", date: "2026-08-20",
    });

    const otherUser = await request(app).post("/api/auth/register").send({
      name: "Other User",
      email: `other-${Date.now()}@example.com`,
      password: "StrongPass1",
    });
    const otherToken = otherUser.body.data.accessToken;

    const res = await request(app)
      .get("/api/expenses")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.body.data.total).toBe(0);
  });
});

describe("Income API + financial summary", () => {
  it("creates income and computes a deterministic summary", async () => {
    await auth(request(app).post("/api/income")).send({
      amount: 25000, source: "salary", date: "2026-08-01",
    });
    await auth(request(app).post("/api/expenses")).send({
      amount: 5000, merchant: "Rent share", category: "Rent", date: "2026-08-05",
    });
    await auth(request(app).post("/api/expenses")).send({
      amount: 3000, merchant: "Groceries", category: "Groceries", date: "2026-08-10",
    });

    const res = await auth(
      request(app).get("/api/income/summary?startDate=2026-08-01&endDate=2026-08-31")
    );

    expect(res.status).toBe(200);
    expect(res.body.data.totalIncome).toBe(25000);
    expect(res.body.data.totalExpenses).toBe(8000);
    expect(res.body.data.availableBalance).toBe(17000);
    expect(res.body.data.savingsRate).toBe(68);
  });

  it("rejects an income entry with an invalid source", async () => {
    const res = await auth(request(app).post("/api/income")).send({
      amount: 1000, source: "lottery", date: "2026-08-01",
    });
    expect(res.status).toBe(400);
  });
});
