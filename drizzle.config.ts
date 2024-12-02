import { defineConfig } from "drizzle-kit";
import { config } from "./config/config";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/drizzle/schema.ts",
  out: "./migrations",
  dbCredentials: {
    url: config._env.DATABASE_URL,
  },
});
