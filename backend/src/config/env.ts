import dotenv from "dotenv";
dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const jwtSecret = process.env.JWT_SECRET || "dev_only_insecure_secret_change_me";
const jwtRefreshSecret =
  process.env.JWT_REFRESH_SECRET || "dev_only_insecure_refresh_secret_change_me";

if (nodeEnv === "production") {
  const errors: string[] = [];
  const configuredJwtSecret = process.env.JWT_SECRET;
  const configuredRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!configuredJwtSecret || configuredJwtSecret.length < 32 || configuredJwtSecret.startsWith("replace_")) {
    errors.push("JWT_SECRET must be set to a random value of at least 32 characters");
  }
  if (
    !configuredRefreshSecret ||
    configuredRefreshSecret.length < 32 ||
    configuredRefreshSecret.startsWith("replace_")
  ) {
    errors.push("JWT_REFRESH_SECRET must be set to a random value of at least 32 characters");
  }
  if (configuredJwtSecret && configuredJwtSecret === configuredRefreshSecret) {
    errors.push("JWT_SECRET and JWT_REFRESH_SECRET must be different");
  }
  if (!process.env.MONGODB_URI || /^mongodb:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(process.env.MONGODB_URI)) {
    errors.push("MONGODB_URI must point to a configured production database");
  }

  if (errors.length > 0) {
    throw new Error(`[config] Invalid production configuration: ${errors.join("; ")}`);
  }
}

export const env = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv,
  clientUrl: process.env.CLIENT_URL || "http://localhost:8080",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/spendwise",
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  jwtRefreshSecret,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  aiProvider: process.env.AI_PROVIDER || "none",
  aiApiKey: process.env.AI_API_KEY || "",
  aiModel: process.env.AI_MODEL || "",
  ocrProvider: process.env.OCR_PROVIDER || "none",
  ocrApiKey: process.env.OCR_API_KEY || "",
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000",
};
