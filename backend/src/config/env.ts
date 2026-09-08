import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/spendwise",
  jwtSecret: process.env.JWT_SECRET || "dev_only_insecure_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || "dev_only_insecure_refresh_secret_change_me",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  aiProvider: process.env.AI_PROVIDER || "none",
  aiApiKey: process.env.AI_API_KEY || "",
  aiModel: process.env.AI_MODEL || "",
  ocrProvider: process.env.OCR_PROVIDER || "none",
  ocrApiKey: process.env.OCR_API_KEY || "",
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000",
};
