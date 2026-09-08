import { createApp } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";

async function main() {
  await connectDB();
  const app = createApp();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] SpendWise AI API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[server] Fatal startup error:", err);
  process.exit(1);
});
