import { defineConfig } from "drizzle-kit";
import { config } from "./config/config";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: config._env.DATABASE_URL,
  },
});
