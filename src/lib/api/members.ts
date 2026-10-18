import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { type Db, db } from "../../db";
import {
	feeAdjustments,
	games,
	memberGames,
	memberStatusLogs,
	members,
	payments,
	visitCharges,
} from "../../db/schema";
import { ACADEMY_ID } from "../academy";
import {
	chargeFor,
	monthlyCharges,
	owedThrough,
	type PersonType,
} from "../ledger";
import { localDate, todayIn } from "../time";
import { type PersonRecord, readPeople } from "./data";
import {
	paise,
	personBatch,
	personName,
	personType,
	phone,
	recordId,
	shortNote,
} from "./schemas";

export interface PersonListItem {
	id: string;
	name: string;
	type: PersonType;
	batch: "morning" | "evening" | "both";
	sports: string[];
	contactNumber: string | null;
	address: string | null;
	status: "active" | "inactive";
	owed: number;
}

export const getMembers = createServerFn({ method: "GET" }).handler(
	async () => {
		const { people, currentMonth } = readPeople(db);
		const list: PersonListItem[] = people.map((person) => ({
			id: person.id,
			name: person.name,
			type: person.type,
			batch: person.batch,
			sports: person.sports,
			contactNumber: person.contactNumber,
			address: person.address,
			status: person.status,
			owed: owedThrough(person.ledger, currentMonth),
		}));
		return {
			members: list,
			summary: {
				total: list.length,
				totalActive: list.filter((p) => p.status === "active").length,
			},
		};
	},
);

const memberFields = z.object({
	name: personName,
	type: personType,
	batch: personBatch,
	gameIds: z.array(recordId).max(10),
	contactNumber: phone,
	address: shortNote.optional(),
	customMonthlyAmount: paise.optional(),
});

const memberRules = (input: z.infer<typeof memberFields>) => {
	const issues: Array<{ message: string; path: string[] }> = [];
	if (input.gameIds.length === 0) {
		issues.push({ message: "Choose at least one game", path: ["gameIds"] });
	}
	if (input.type === "guest" && input.customMonthlyAmount !== undefined) {
		issues.push({
			message: "Guests pay per visit, so they have no monthly amount",
			path: ["customMonthlyAmount"],
		});
	}
	return issues;
};

const registerInput = memberFields.superRefine((input, ctx) => {
	for (const issue of memberRules(input))
		ctx.addIssue({ code: "custom", ...issue });
});

/** Adds a person. Games must belong to this academy. */
export const registerMember = createServerFn({ method: "POST" })
	.validator(registerInput)
	.handler(async ({ data }) => {
		return db.transaction((tx) => {
			assertGamesExist(tx, data.gameIds);
			const memberId = `mem_${crypto.randomUUID()}`;
			tx.insert(members)
				.values({
					id: memberId,
					academyId: ACADEMY_ID,
					name: data.name,
					type: data.type,
					batch: data.batch,
					contactNumber: data.contactNumber ?? null,
					address: data.address || null,
					status: "active",
					customMonthlyAmount: data.customMonthlyAmount ?? null,
				})
				.run();
			insertGames(tx, memberId, data.gameIds);
			return { success: true, memberId };
		});
	});

const updateInput = memberFields
	.extend({ memberId: recordId })
	.superRefine((input, ctx) => {
		for (const issue of memberRules(input))
			ctx.addIssue({ code: "custom", ...issue });
	});

/**
 * Edits a person's details. Unsettled months follow the new type, games or amount,
 * the same way they follow a rate change. Settled months stay as they were.
 */
export const updateMember = createServerFn({ method: "POST" })
	.validator(updateInput)
	.handler(async ({ data }) => {
		return db.transaction((tx) => {
			assertMemberExists(tx, data.memberId);
			assertGamesExist(tx, data.gameIds);
			tx.update(members)
				.set({
					name: data.name,
					type: data.type,
					batch: data.batch,
					contactNumber: data.contactNumber ?? null,
					address: data.address || null,
					customMonthlyAmount: data.customMonthlyAmount ?? null,
				})
				.where(
					and(eq(members.academyId, ACADEMY_ID), eq(members.id, data.memberId)),
				)
				.run();
			tx.delete(memberGames)
				.where(
					and(
						eq(memberGames.academyId, ACADEMY_ID),
						eq(memberGames.memberId, data.memberId),
					),
				)
				.run();
			insertGames(tx, data.memberId, data.gameIds);
			return { success: true };
		});
	});

const statusInput = z.object({
	memberId: recordId,
	status: z.enum(["active", "inactive"]),
	reason: shortNote.optional(),
});

/** Sets active or inactive. Each change is logged with its date. */
export const updateMemberStatus = createServerFn({ method: "POST" })
	.validator(statusInput)
	.handler(async ({ data }) => {
		return db.transaction((tx) => {
			assertMemberExists(tx, data.memberId);
			tx.update(members)
				.set({ status: data.status })
				.where(
					and(eq(members.academyId, ACADEMY_ID), eq(members.id, data.memberId)),
				)
				.run();
			tx.insert(memberStatusLogs)
				.values({
					id: `log_${crypto.randomUUID()}`,
					academyId: ACADEMY_ID,
					memberId: data.memberId,
					status: data.status,
					reason: data.reason || "Set by management",
				})
				.run();
			return { success: true };
		});
	});

export interface LedgerLine {
	id: string;
	date: string;
	kind: "monthly_fee" | "adjustment" | "visit_charge" | "payment" | "reversal";
	description: string;
	/** Positive amount in paise. null when the monthly amount still has to be typed. */
	amount: number | null;
	/** owed = adds to what is owed, paid = reduces it, info = no money effect. */
	effect: "owed" | "paid" | "info";
	reversible: boolean;
}

const personQuery = z.object({ memberId: recordId });

/** One person's ledger and what they owe now. Same rules as the settle screen. */
export const getMemberLedger = createServerFn({ method: "GET" })
	.validator(personQuery)
	.handler(async ({ data }) => {
		const { people, currentMonth, timezone } = readPeople(db);
		const person = findPerson(people, data.memberId);

		const lines: LedgerLine[] = [];

		if (person.type !== "guest") {
			for (const charge of monthlyCharges(person.ledger, currentMonth)) {
				lines.push({
					id: `fee_${charge.month}`,
					date: `${charge.month}-01`,
					kind: "monthly_fee",
					description: `Monthly fee, ${monthLabel(charge.month)}`,
					amount: charge.amount,
					effect: charge.amount === null ? "info" : "owed",
					reversible: false,
				});
			}
		}

		const gameRows = db
			.select({
				id: games.id,
				name: games.name,
				memberMonthlyAmount: games.memberMonthlyAmount,
				studentMonthlyAmount: games.studentMonthlyAmount,
				guestVisitAmount: games.guestVisitAmount,
			})
			.from(games)
			.where(eq(games.academyId, ACADEMY_ID))
			.orderBy(asc(games.name))
			.all();

		const adjustmentRows = db
			.select()
			.from(feeAdjustments)
			.where(
				and(
					eq(feeAdjustments.academyId, ACADEMY_ID),
					eq(feeAdjustments.memberId, data.memberId),
				),
			)
			.orderBy(asc(sql`rowid`))
			.all();
		for (const row of adjustmentRows) {
			lines.push({
				id: row.id,
				date: localDate(row.createdAt ?? new Date(), timezone),
				kind: "adjustment",
				description: adjustmentText(row),
				amount: row.amountAfter,
				effect: "info",
				reversible: false,
			});
		}

		const visitRows = db
			.select({
				id: visitCharges.id,
				date: visitCharges.date,
				amount: visitCharges.amount,
				notes: visitCharges.notes,
				gameName: games.name,
			})
			.from(visitCharges)
			.innerJoin(games, eq(visitCharges.gameId, games.id))
			.where(
				and(
					eq(visitCharges.academyId, ACADEMY_ID),
					eq(visitCharges.memberId, data.memberId),
				),
			)
			.all();
		for (const row of visitRows) {
			lines.push({
				id: row.id,
				date: row.date,
				kind: "visit_charge",
				description: `${row.gameName} visit`,
				amount: row.amount,
				effect: "owed",
				reversible: false,
			});
		}

		const paymentRows = db
			.select()
			.from(payments)
			.where(
				and(
					eq(payments.academyId, ACADEMY_ID),
					eq(payments.memberId, data.memberId),
				),
			)
			.orderBy(asc(sql`rowid`))
			.all() as Array<typeof payments.$inferSelect>;
		const reversedIds = new Set(
			paymentRows
				.map((row) => row.reversalOfId)
				.filter((id): id is string => id !== null),
		);
		for (const row of paymentRows) {
			const isReversal = row.reversalOfId !== null;
			lines.push({
				id: row.id,
				date: localDate(row.paidAt ?? new Date(), timezone),
				kind: isReversal ? "reversal" : "payment",
				description: isReversal
					? `Reversal, ${row.notes ?? ""}`.trim()
					: `Payment by ${row.paymentMethod}${row.notes ? `, ${row.notes}` : ""}`,
				amount: row.amount,
				effect: isReversal ? "owed" : "paid",
				reversible: !isReversal && !reversedIds.has(row.id),
			});
		}

		lines.sort(
			(a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
		);

		return {
			member: publicPerson(person),
			games: gameRows,
			today: todayIn(timezone),
			currentMonth,
			owed: owedThrough(person.ledger, currentMonth),
			currentCharge:
				person.type === "guest" ? null : chargeFor(person.ledger, currentMonth),
			lines,
		};
	});

function monthLabel(month: string): string {
	const [year, monthNumber] = month.split("-").map(Number);
	return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString(
		"en-IN",
		{
			month: "long",
			year: "numeric",
			timeZone: "UTC",
		},
	);
}

function publicPerson(person: PersonRecord) {
	return {
		id: person.id,
		name: person.name,
		type: person.type,
		batch: person.batch,
		status: person.status,
		contactNumber: person.contactNumber,
		address: person.address,
		sports: person.sports,
		games: person.games,
		customMonthlyAmount: person.customMonthlyAmount,
	};
}

function findPerson(people: PersonRecord[], memberId: string): PersonRecord {
	const person = people.find((p) => p.id === memberId);
	if (!person) throw new Error("Person not found");
	return person;
}

function adjustmentText(row: {
	month: string;
	action: string;
	amountBefore: number | null;
	amountAfter: number;
	reason: string | null;
}): string {
	const label =
		row.action === "waive_no_fee"
			? "No fee"
			: row.action === "switch_to_visits"
				? "Charged per visit instead"
				: "Amount set";
	const rupees = (paise: number) => (paise / 100).toLocaleString("en-IN");
	const before =
		row.amountBefore === null ? "not set" : rupees(row.amountBefore);
	const reason = row.reason ? `, ${row.reason}` : "";
	return `${label} for ${row.month} (was ${before}, now ${rupees(row.amountAfter)}${reason})`;
}

function assertMemberExists(tx: Db, memberId: string) {
	const row = tx
		.select({ id: members.id })
		.from(members)
		.where(and(eq(members.academyId, ACADEMY_ID), eq(members.id, memberId)))
		.get();
	if (!row) throw new Error("Person not found");
}

function assertGamesExist(tx: Db, gameIds: string[]) {
	for (const gameId of gameIds) {
		const row = tx
			.select({ id: games.id })
			.from(games)
			.where(and(eq(games.academyId, ACADEMY_ID), eq(games.id, gameId)))
			.get();
		if (!row) throw new Error("Game not found");
	}
}

function insertGames(tx: Db, memberId: string, gameIds: string[]) {
	for (const gameId of new Set(gameIds)) {
		tx.insert(memberGames)
			.values({
				id: `mg_${crypto.randomUUID()}`,
				academyId: ACADEMY_ID,
				memberId,
				gameId,
			})
			.run();
	}
}
