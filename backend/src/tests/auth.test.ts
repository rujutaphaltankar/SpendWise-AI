import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../app";

const app = createApp();
let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
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

describe("Auth API (requires downloadable mongod binary — run locally)", () => {
  const validUser = {
    name: "Rujuta Phaltankar",
    email: "rujuta@example.com",
    password: "StrongPass1",
  };

  it("registers a new user and returns tokens", async () => {
    const res = await request(app).post("/api/auth/register").send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it("rejects duplicate email registration", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app).post("/api/auth/register").send(validUser);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("rejects weak passwords", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, email: "weak@example.com", password: "weak" });
    expect(res.status).toBe(400);
  });

  it("logs in with correct credentials", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it("rejects login with wrong password", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: "WrongPass1" });
    expect(res.status).toBe(401);
  });

  it("blocks /me without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user with a valid token", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(validUser);
    const token = registerRes.body.data.accessToken;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(validUser.email);
  });

  it("updates profile fields", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(validUser);
    const token = registerRes.body.data.accessToken;

    const res = await request(app)
      .put("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ monthlyIncome: 25000, savingsGoalAmount: 70000, currency: "INR" });

    expect(res.status).toBe(200);
    expect(res.body.data.monthlyIncome).toBe(25000);
    expect(res.body.data.savingsGoalAmount).toBe(70000);
  });

  it("refreshes tokens with a valid refresh token", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(validUser);
    const refreshToken = registerRes.body.data.refreshToken;

    const res = await request(app).post("/api/auth/refresh").send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });
});
