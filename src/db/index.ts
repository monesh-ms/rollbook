import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./schema.ts";

// Both drivers are synchronous. The same type covers the database and a transaction.
export type Db = BaseSQLiteDatabase<"sync", unknown, typeof schema>;

const dbUrl = process.env.DATABASE_URL || "dev.db";

let dbInstance: unknown;

if (typeof (globalThis as Record<string, unknown>).Bun !== "undefined") {
	const { Database } = await import("bun:sqlite");
	const { drizzle } = await import("drizzle-orm/bun-sqlite");
	const sqlite = new Database(dbUrl);
	dbInstance = drizzle(sqlite, { schema });
} else {
	const { drizzle } = await import("drizzle-orm/better-sqlite3");
	dbInstance = drizzle(dbUrl, { schema });
}

export const db = dbInstance as Db;
