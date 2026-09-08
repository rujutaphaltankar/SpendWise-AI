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

describe("POST /api/expenses/parse", () => {
  it("extracts structured data from a natural-language description", async () => {
    const res = await auth(request(app).post("/api/expenses/parse")).send({
      text: "Spent ₹450 on Zomato",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(450);
    expect(res.body.data.merchant).toBe("Zomato");
    expect(res.body.data.category).toBe("Food");
    expect(res.body.data.confidence).toBeGreaterThan(0);
  });

  it("rejects text shorter than the minimum length", async () => {
    const res = await auth(request(app).post("/api/expenses/parse")).send({ text: "hi" });
    expect(res.status).toBe(400);
  });

  it("requires authentication", async () => {
    const res = await request(app).post("/api/expenses/parse").send({ text: "Spent 100 on food" });
    expect(res.status).toBe(401);
  });

  it("the extracted expense can be saved directly via the create endpoint", async () => {
    const parseRes = await auth(request(app).post("/api/expenses/parse")).send({
      text: "Spent ₹450 on Zomato",
    });
    const extracted = parseRes.body.data;

    const createRes = await auth(request(app).post("/api/expenses")).send({
      amount: extracted.amount,
      merchant: extracted.merchant,
      category: extracted.category,
      date: extracted.date,
      paymentMethod: extracted.paymentMethod ?? undefined,
      description: extracted.description ?? undefined,
      source: "natural-language",
    });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.merchant).toBe("Zomato");
    expect(createRes.body.data.source).toBe("natural-language");
  });
});
