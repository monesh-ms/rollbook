import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./schema.ts";

export type Db = BaseSQLiteDatabase<"async", unknown, typeof schema>;

const dbUrl = process.env.DATABASE_URL || "dev.db";

let _dbInstance: Db | null = null;

export function getDb(): Db {
	if (_dbInstance) return _dbInstance;

	// 1. Cloudflare Workers D1 binding
	const globalEnv = (
		globalThis as unknown as {
			__env__?: { DB?: Parameters<typeof drizzleD1>[0] };
			DB?: Parameters<typeof drizzleD1>[0];
		}
	).__env__;
	const d1Binding =
		globalEnv?.DB ||
		(
			globalThis as unknown as {
				DB?: Parameters<typeof drizzleD1>[0];
			}
		).DB;

	if (d1Binding) {
		const inst = drizzleD1(d1Binding, { schema }) as unknown as Db;
		_dbInstance = inst;
		return inst;
	}

	// 2. Bun runtime
	if (typeof (globalThis as Record<string, unknown>).Bun !== "undefined") {
		const { Database } = require("bun:sqlite");
		const { drizzle } = require("drizzle-orm/bun-sqlite");
		const sqlite = new Database(dbUrl);
		const inst = drizzle(sqlite, { schema }) as unknown as Db;
		_dbInstance = inst;
		return inst;
	}

	// 3. Node runtime
	const { drizzle } = require("drizzle-orm/better-sqlite3");
	const inst = drizzle(dbUrl, { schema }) as unknown as Db;
	_dbInstance = inst;
	return inst;
}

export const db = new Proxy({} as Db, {
	get(_target, prop) {
		const target = getDb();
		const val = (target as unknown as Record<string | symbol, unknown>)[prop];
		return typeof val === "function" ? val.bind(target) : val;
	},
});
