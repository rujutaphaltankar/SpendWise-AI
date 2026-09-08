import { registerSchema, loginSchema } from "../validators/authValidators";
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens";

describe("registerSchema", () => {
  it("accepts a valid registration payload", () => {
    const result = registerSchema.safeParse({
      name: "Rujuta Phaltankar",
      email: "rujuta@example.com",
      password: "StrongPass1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password with no uppercase letter", () => {
    const result = registerSchema.safeParse({
      name: "Rujuta",
      email: "rujuta@example.com",
      password: "weakpass1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Rujuta",
      email: "not-an-email",
      password: "StrongPass1",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires an email and non-empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("JWT tokens", () => {
  it("signs and verifies an access token", () => {
    const token = signAccessToken({ userId: "abc123" });
    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe("abc123");
  });

  it("signs and verifies a refresh token", () => {
    const token = signRefreshToken({ userId: "xyz789" });
    const payload = verifyRefreshToken(token);
    expect(payload.userId).toBe("xyz789");
  });

  it("throws on a tampered token", () => {
    const token = signAccessToken({ userId: "abc123" });
    expect(() => verifyAccessToken(token + "tampered")).toThrow();
  });
});
