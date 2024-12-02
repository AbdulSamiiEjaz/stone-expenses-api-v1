import { drizzle } from "drizzle-orm/node-postgres";
import { config } from "../../config/config";

export const db = drizzle(config._env.DATABASE_URL);
