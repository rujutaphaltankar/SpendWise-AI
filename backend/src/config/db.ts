import mongoose from "mongoose";
import { env } from "./env";

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.mongodbUri);
    isConnected = true;
    // eslint-disable-next-line no-console
    console.log(`[db] Connected to MongoDB at ${maskUri(env.mongodbUri)}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[db] Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  isConnected = false;
}

function maskUri(uri: string): string {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
}
