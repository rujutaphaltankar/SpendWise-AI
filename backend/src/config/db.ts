import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "./env";

let isConnected = false;
let memoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.mongodbUri);
    isConnected = true;
    // eslint-disable-next-line no-console
    console.log(`[db] Connected to MongoDB at ${maskUri(env.mongodbUri)}`);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      try {
        memoryServer = await MongoMemoryServer.create();
        const uri = memoryServer.getUri();
        await mongoose.connect(uri);
        isConnected = true;
        // eslint-disable-next-line no-console
        console.log(`[db] Connected to in-memory MongoDB at ${maskUri(uri)}`);
        return;
      } catch (memoryErr) {
        // eslint-disable-next-line no-console
        console.error("[db] Failed to connect to in-memory MongoDB:", memoryErr);
      }
    }

    // eslint-disable-next-line no-console
    console.error("[db] Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  isConnected = false;

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

function maskUri(uri: string): string {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
}
