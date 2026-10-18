import { describe, expect, test } from "bun:test";
import { requireAuth, resolveAuthUser } from "./api/auth";

describe("auth helpers", () => {
	test("requireAuth returns test session in test environment", async () => {
		const session = await requireAuth();
		expect(session.userId).toBe("test_user");
	});

	test("resolveAuthUser returns user in test environment", async () => {
		const auth = await resolveAuthUser();
		expect(auth.userId).toBe("test_user");
	});
});
