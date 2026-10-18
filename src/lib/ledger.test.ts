import { describe, expect, test } from "bun:test";
import {
	type GameRates,
	monthsToFreeze,
	owedThrough,
	type PersonLedger,
	suggestMonthlyAmount,
} from "./ledger";
import { localMonth, monthsBetween } from "./time";

const badminton: GameRates = {
	id: "game_badminton",
	name: "Badminton",
	memberMonthlyAmount: 300000,
	studentMonthlyAmount: 200000,
	guestVisitAmount: 40000,
};
const tennis: GameRates = {
	id: "game_tennis",
	name: "Tennis",
	memberMonthlyAmount: 450000,
	studentMonthlyAmount: 350000,
	guestVisitAmount: 70000,
};

function person(overrides: Partial<PersonLedger>): PersonLedger {
	return {
		type: "student",
		games: [badminton],
		customMonthlyAmount: null,
		joinMonth: "2026-08",
		inactiveSince: null,
		frozen: [],
		adjustments: [],
		visits: [],
		payments: [],
		...overrides,
	};
}

describe("suggestMonthlyAmount", () => {
	test("one game uses the rate for the person's type", () => {
		expect(suggestMonthlyAmount(person({ type: "student" }))).toBe(200000);
		expect(
			suggestMonthlyAmount(person({ type: "member", games: [tennis] })),
		).toBe(450000);
	});

	test("two games with no typed amount have no suggestion", () => {
		expect(
			suggestMonthlyAmount(person({ games: [badminton, tennis] })),
		).toBeNull();
	});

	test("a typed amount wins over the rates", () => {
		expect(
			suggestMonthlyAmount(
				person({ games: [badminton, tennis], customMonthlyAmount: 550000 }),
			),
		).toBe(550000);
	});

	test("guests have no monthly suggestion", () => {
		expect(suggestMonthlyAmount(person({ type: "guest" }))).toBeNull();
	});
});

describe("owedThrough", () => {
	test("a partial payment leaves the rest carried into the next month", () => {
		const asha = person({
			joinMonth: "2026-09",
			frozen: [{ month: "2026-09", amountDue: 200000 }],
			payments: [{ date: "2026-09-12", amount: 100000, reversal: false }],
		});
		expect(owedThrough(asha, "2026-09")).toBe(100000);
		expect(owedThrough(asha, "2026-10")).toBe(300000);
	});

	test("a reversal adds the payment back", () => {
		const asha = person({
			joinMonth: "2026-09",
			frozen: [{ month: "2026-09", amountDue: 200000 }],
			payments: [
				{ date: "2026-09-12", amount: 100000, reversal: false },
				{ date: "2026-09-20", amount: 100000, reversal: true },
			],
		});
		expect(owedThrough(asha, "2026-09")).toBe(200000);
	});

	test("an inactive person gets no new fee from the month they were set inactive", () => {
		const ravi = person({
			type: "member",
			joinMonth: "2026-09",
			frozen: [{ month: "2026-09", amountDue: 150000 }],
			inactiveSince: "2026-10",
		});
		expect(owedThrough(ravi, "2026-10")).toBe(150000);
	});

	test("visit charges are owed like any other charge", () => {
		const leela = person({
			type: "student",
			joinMonth: "2026-10",
			visits: [
				{ date: "2026-10-03", amount: 40000 },
				{ date: "2026-10-09", amount: 40000 },
			],
		});
		expect(owedThrough(leela, "2026-10")).toBe(80000 + 200000);
	});

	test("a correction replaces the amount for that month only", () => {
		const dev = person({
			type: "member",
			games: [tennis],
			joinMonth: "2026-09",
			adjustments: [
				{ month: "2026-09", amountAfter: 0, action: "waive_no_fee" },
			],
		});
		expect(owedThrough(dev, "2026-09")).toBe(0);
		expect(owedThrough(dev, "2026-10")).toBe(450000);
	});
});

describe("settled months keep their amount", () => {
	test("a rate change moves unsettled months but not frozen ones", () => {
		const settled = person({
			frozen: [{ month: "2026-09", amountDue: 200000 }],
			payments: [{ date: "2026-09-28", amount: 200000, reversal: false }],
			joinMonth: "2026-09",
		});
		const raised = { ...badminton, studentMonthlyAmount: 250000 };
		const after = { ...settled, games: [raised] };
		expect(owedThrough(after, "2026-09")).toBe(0);
		expect(owedThrough(after, "2026-10")).toBe(250000);
	});

	test("freezes only months that are fully covered", () => {
		const asha = person({
			joinMonth: "2026-09",
			payments: [{ date: "2026-09-28", amount: 200000, reversal: false }],
		});
		expect(monthsToFreeze(asha, "2026-10")).toEqual([
			{ month: "2026-09", amountDue: 200000 },
		]);
	});
});

describe("academy calendar", () => {
	test("an instant late on the last day of September is October in Kolkata", () => {
		const instant = new Date("2026-09-30T19:00:00Z");
		expect(localMonth(instant, "Asia/Kolkata")).toBe("2026-10");
		expect(localMonth(instant, "UTC")).toBe("2026-09");
	});

	test("months between are inclusive", () => {
		expect(monthsBetween("2026-11", "2027-02")).toEqual([
			"2026-11",
			"2026-12",
			"2027-01",
			"2027-02",
		]);
	});
});
