import * as schema from "./schema.ts";

const dbUrl = process.env.DATABASE_URL || "dev.db";

let dbInstance: any;

if (typeof (globalThis as any).Bun !== "undefined") {
	// @ts-expect-error
	const { Database } = await import("bun:sqlite");
	const { drizzle } = await import("drizzle-orm/bun-sqlite");
	const sqlite = new Database(dbUrl);
	dbInstance = drizzle(sqlite, { schema });
} else {
	const { drizzle } = await import("drizzle-orm/better-sqlite3");
	dbInstance = drizzle(dbUrl, { schema });
}

export const db = dbInstance;
