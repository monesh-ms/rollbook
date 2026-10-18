import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { type Db, db } from "../../db";
import {
	attendance,
	feeAdjustments,
	games,
	monthlyFees,
	payments,
	visitCharges,
} from "../../db/schema";
import { ACADEMY_ID } from "../academy";
import {
	type ChargeSource,
	chargeFor,
	monthsToFreeze,
	owedThrough,
	paidIn,
	previousMonth,
} from "../ledger";
import { type PersonRecord, readPeople } from "./data";
import {
	calendarDate,
	calendarMonth,
	paise,
	positivePaise,
	recordId,
	shortNote,
} from "./schemas";

export interface SettleAccount {
	memberId: string;
	name: string;
	type: "member" | "student";
	sports: string[];
	batch: "morning" | "evening" | "both";
	status: "active" | "inactive";
	/** Monthly fee for the month. null means the amount still has to be typed. */
	feeThisMonth: number | null;
	feeSource: ChargeSource;
	visitsThisMonth: number;
	paidThisMonth: number;
	/** Owed at the end of the previous month. Never negative. */
	carriedOver: number;
	/** Everything owed through this month, after payments. */
	totalOwed: number;
	needsAmount: boolean;
	isCustomRate: boolean;
	hasAttendanceThisMonth: boolean;
}

function findPerson(people: PersonRecord[], memberId: string): PersonRecord {
	const person = people.find((p) => p.id === memberId);
	if (!person) throw new Error("Person not found");
	return person;
}

/** Freezes months that payments have fully covered, so later rate changes leave them alone. */
function freezeSettledMonths(tx: Db, person: PersonRecord, endMonth: string) {
	for (const row of monthsToFreeze(person.ledger, endMonth)) {
		tx.insert(monthlyFees)
			.values({
				id: `mf_${crypto.randomUUID()}`,
				academyId: ACADEMY_ID,
				memberId: person.id,
				month: row.month,
				amountDue: row.amountDue,
				status: "standard",
			})
			.onConflictDoNothing()
			.run();
	}
}

const settlementQuery = z
	.object({ month: calendarMonth.optional() })
	.optional();

/** Who still owes money for a month. Guests are not on this list. Settled people are not either. */
export const getMonthSettlement = createServerFn({ method: "GET" })
	.validator(settlementQuery)
	.handler(async ({ data }) => {
		const { people, currentMonth } = readPeople(db);
		const month = data?.month ?? currentMonth;

		const attendedIds = new Set<string>(
			db
				.select({ memberId: attendance.memberId })
				.from(attendance)
				.where(
					and(
						eq(attendance.academyId, ACADEMY_ID),
						sql`${attendance.date} LIKE ${`${month}%`}`,
					),
				)
				.all()
				.map((row: { memberId: string }) => row.memberId),
		);

		const accounts: SettleAccount[] = [];
		for (const person of people) {
			if (person.type === "guest") continue;
			const charge = chargeFor(person.ledger, month);
			const totalOwed = owedThrough(person.ledger, month);
			const needsAmount = charge.amount === null;
			if (totalOwed <= 0 && !needsAmount) continue;

			accounts.push({
				memberId: person.id,
				name: person.name,
				type: person.type,
				sports: person.sports,
				batch: person.batch,
				status: person.status,
				feeThisMonth: charge.amount,
				feeSource: charge.source,
				visitsThisMonth: person.ledger.visits
					.filter((visit) => visit.date.slice(0, 7) === month)
					.reduce((sum, visit) => sum + visit.amount, 0),
				paidThisMonth: paidIn(person.ledger, month),
				carriedOver: Math.max(
					0,
					owedThrough(person.ledger, previousMonth(month)),
				),
				totalOwed,
				needsAmount,
				isCustomRate: person.customMonthlyAmount !== null,
				hasAttendanceThisMonth: attendedIds.has(person.id),
			});
		}

		accounts.sort((a, b) => a.name.localeCompare(b.name));

		return {
			month,
			currentMonth,
			summary: {
				totalOwed: accounts.reduce(
					(sum, a) => sum + Math.max(0, a.totalOwed),
					0,
				),
				carriedOver: accounts.reduce((sum, a) => sum + a.carriedOver, 0),
				unsettledCount: accounts.length,
				needsAmountCount: accounts.filter((a) => a.needsAmount).length,
			},
			accounts,
		};
	});

const paymentInput = z.object({
	memberId: recordId,
	amount: positivePaise,
	paymentMethod: z.enum(["cash", "upi", "other"]),
	notes: shortNote.optional(),
});

/** Appends a payment. Months it fully covers are frozen at their current amount. */
export const recordPayment = createServerFn({ method: "POST" })
	.validator(paymentInput)
	.handler(async ({ data }) => {
		return db.transaction((tx) => {
			const { people, currentMonth } = readPeople(tx);
			findPerson(people, data.memberId);

			tx.insert(payments)
				.values({
					id: `pay_${crypto.randomUUID()}`,
					academyId: ACADEMY_ID,
					memberId: data.memberId,
					amount: data.amount,
					paymentMethod: data.paymentMethod,
					notes: data.notes || null,
				})
				.run();

			const after = findPerson(readPeople(tx).people, data.memberId);
			freezeSettledMonths(tx, after, currentMonth);
			return { success: true };
		});
	});

const reversalInput = z.object({
	paymentId: recordId,
	reason: shortNote.optional(),
});

/** Undoes a payment by adding a reversal row. The original stays in the log. */
export const reversePayment = createServerFn({ method: "POST" })
	.validator(reversalInput)
	.handler(async ({ data }) => {
		return db.transaction((tx) => {
			const original = tx
				.select()
				.from(payments)
				.where(
					and(
						eq(payments.academyId, ACADEMY_ID),
						eq(payments.id, data.paymentId),
					),
				)
				.get();
			if (!original) throw new Error("Payment not found");
			if (original.reversalOfId)
				throw new Error("A reversal cannot be reversed");

			const existing = tx
				.select({ id: payments.id })
				.from(payments)
				.where(eq(payments.reversalOfId, original.id))
				.get();
			if (existing) throw new Error("This payment is already reversed");

			const reversalId = `pay_${crypto.randomUUID()}`;
			tx.insert(payments)
				.values({
					id: reversalId,
					academyId: ACADEMY_ID,
					memberId: original.memberId,
					amount: original.amount,
					paymentMethod: original.paymentMethod,
					reversalOfId: original.id,
					notes: data.reason || `Reversal of ${original.id}`,
				})
				.run();

			return { success: true, reversalId };
		});
	});

const adjustInput = z
	.object({
		memberId: recordId,
		month: calendarMonth,
		action: z.enum(["set_amount", "waive_no_fee", "switch_to_visits"]),
		amount: paise.optional(),
		reason: shortNote.optional(),
	})
	.refine(
		(input) => input.action !== "set_amount" || input.amount !== undefined,
		{ message: "Enter the amount for this month", path: ["amount"] },
	);

const statusFor = {
	set_amount: "standard",
	waive_no_fee: "waived_no_fee",
	switch_to_visits: "switched_to_visits",
} as const;

/**
 * Corrects one month's fee for one person. Appends a correction and keeps the
 * amount it replaced. Other months and other people are not affected.
 */
export const adjustMonthlyFee = createServerFn({ method: "POST" })
	.validator(adjustInput)
	.handler(async ({ data }) => {
		return db.transaction((tx) => {
			const { people, currentMonth } = readPeople(tx);
			const person = findPerson(people, data.memberId);
			if (person.type === "guest")
				throw new Error("Guests have no monthly fee");
			if (data.month > currentMonth) {
				throw new Error(
					"A fee can only be corrected for this month or earlier",
				);
			}

			const current = chargeFor(person.ledger, data.month);
			const amountAfter = data.action === "set_amount" ? (data.amount ?? 0) : 0;

			const existingRow = tx
				.select({ id: monthlyFees.id })
				.from(monthlyFees)
				.where(
					and(
						eq(monthlyFees.academyId, ACADEMY_ID),
						eq(monthlyFees.memberId, data.memberId),
						eq(monthlyFees.month, data.month),
					),
				)
				.get();
			if (!existingRow) {
				tx.insert(monthlyFees)
					.values({
						id: `mf_${crypto.randomUUID()}`,
						academyId: ACADEMY_ID,
						memberId: data.memberId,
						month: data.month,
						amountDue: current.amount ?? 0,
						status: statusFor[data.action],
					})
					.run();
			} else {
				tx.update(monthlyFees)
					.set({ status: statusFor[data.action] })
					.where(eq(monthlyFees.id, existingRow.id))
					.run();
			}

			tx.insert(feeAdjustments)
				.values({
					id: `adj_${crypto.randomUUID()}`,
					academyId: ACADEMY_ID,
					memberId: data.memberId,
					month: data.month,
					action: data.action,
					amountBefore: current.amount,
					amountAfter,
					reason: data.reason || null,
				})
				.run();

			return { success: true };
		});
	});

const visitInput = z.object({
	memberId: recordId,
	date: calendarDate,
	gameId: recordId,
	amount: positivePaise,
	notes: shortNote.optional(),
});

/** Records one visit for a guest or a short-stay student. Members are never charged per visit. */
export const recordVisitCharge = createServerFn({ method: "POST" })
	.validator(visitInput)
	.handler(async ({ data }) => {
		return db.transaction((tx) => {
			const { people } = readPeople(tx);
			const person = findPerson(people, data.memberId);
			if (person.type === "member") {
				throw new Error(
					"Members pay monthly. Only guests and students are charged per visit",
				);
			}

			const game = tx
				.select({ id: games.id })
				.from(games)
				.where(and(eq(games.academyId, ACADEMY_ID), eq(games.id, data.gameId)))
				.get();
			if (!game) throw new Error("Game not found");

			tx.insert(visitCharges)
				.values({
					id: `vc_${crypto.randomUUID()}`,
					academyId: ACADEMY_ID,
					memberId: data.memberId,
					date: data.date,
					gameId: data.gameId,
					amount: data.amount,
					notes: data.notes || null,
				})
				.run();

			return { success: true };
		});
	});
