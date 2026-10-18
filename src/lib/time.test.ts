import { describe, expect, test } from "bun:test";
import { addMonths, dateInMonth, isCalendarDate } from "./time";

describe("calendar helpers", () => {
	test("rejects dates that do not exist", () => {
		expect(isCalendarDate("2026-02-30")).toBe(false);
		expect(isCalendarDate("2026-13-01")).toBe(false);
		expect(isCalendarDate("2026-10-12")).toBe(true);
	});

	test("adds months across a year boundary", () => {
		expect(addMonths("2026-12", 1)).toBe("2027-01");
		expect(addMonths("2026-01", -1)).toBe("2025-12");
	});

	test("keeps the day when moving between months, but not past the last day", () => {
		expect(dateInMonth("2026-10-31", "2026-11")).toBe("2026-11-30");
		expect(dateInMonth("2026-10-12", "2026-11")).toBe("2026-11-12");
	});
});
