import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  out: "./db/migrations",
  schema: "./db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
