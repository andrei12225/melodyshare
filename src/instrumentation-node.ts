import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./lib/db";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Apply pending database migrations on server start
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Database migrations applied");
