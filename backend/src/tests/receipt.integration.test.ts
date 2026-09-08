import request from "supertest";
import mongoose from "mongoose";
import path from "path";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../app";

const app = createApp();
let mongo: MongoMemoryServer;
let accessToken: string;

const SAMPLE_RECEIPT_PATH = path.join(__dirname, "fixtures", "sample-receipt.png");

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

describe("POST /api/receipts/process", () => {
  it("OCRs a real receipt image and returns structured, categorized data", async () => {
    const res = await request(app)
      .post("/api/receipts/process")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("receipt", SAMPLE_RECEIPT_PATH);

    expect(res.status).toBe(200);
    expect(res.body.data.merchant).toBe("Reliance Smart");
    expect(res.body.data.total).toBe(823);
    expect(res.body.data.category).toBe("Groceries");
    expect(res.body.data.lineItems.length).toBeGreaterThanOrEqual(3);
    expect(res.body.data.receiptUrl).toMatch(/^\/uploads\/receipts\//);
  }, 60000);

  it("requires authentication", async () => {
    const res = await request(app).post("/api/receipts/process").attach("receipt", SAMPLE_RECEIPT_PATH);
    expect(res.status).toBe(401);
  });

  it("rejects the request when no file is attached", async () => {
    const res = await request(app)
      .post("/api/receipts/process")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(400);
  });

  it("rejects a disallowed file type", async () => {
    const textFilePath = path.join(__dirname, "fixtures", "not-an-image.txt");
    const res = await request(app)
      .post("/api/receipts/process")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("receipt", textFilePath);
    expect(res.status).toBe(400);
  });
});
