// Server-only reads shared by the API modules. Each call reads the academy's rows
// in a fixed number of queries, so settlement does not query once per person.

import { asc, eq, sql } from "drizzle-orm";
import type { Db } from "../../db";
import {
	academies,
	feeAdjustments,
	games,
	memberGames,
	memberStatusLogs,
	members,
	monthlyFees,
	payments,
	visitCharges,
} from "../../db/schema";
import { ACADEMY_ID } from "../academy";
import type { GameRates, PersonLedger, PersonType } from "../ledger";
import { localDate, localMonth, todayIn } from "../time";

type Connection = Db;

export function readAcademy(conn: Connection) {
	const academy = conn
		.select()
		.from(academies)
		.where(eq(academies.id, ACADEMY_ID))
		.get();
	if (!academy) throw new Error("Academy is not set up");
	return academy as {
		id: string;
		name: string;
		timezone: string;
		currency: string;
	};
}

export function readToday(conn: Connection): string {
	return todayIn(readAcademy(conn).timezone);
}

export interface PersonRecord {
	id: string;
	name: string;
	type: PersonType;
	batch: "morning" | "evening" | "both";
	contactNumber: string | null;
	address: string | null;
	status: "active" | "inactive";
	customMonthlyAmount: number | null;
	joinMonth: string;
	inactiveSince: string | null;
	sports: string[];
	games: GameRates[];
	ledger: PersonLedger;
}

/** Everything needed to compute every person's ledger. Six reads, regardless of headcount. */
export function readPeople(
	conn: Connection,
	now: Date = new Date(),
): {
	timezone: string;
	currentMonth: string;
	people: PersonRecord[];
} {
	const academy = readAcademy(conn);
	const tz = academy.timezone;
	const currentMonth = localMonth(now, tz);

	const memberRows = conn
		.select()
		.from(members)
		.where(eq(members.academyId, ACADEMY_ID))
		.all();
	const gameRows: GameRates[] = conn
		.select()
		.from(games)
		.where(eq(games.academyId, ACADEMY_ID))
		.all();
	const linkRows: Array<{ memberId: string; gameId: string }> = conn
		.select({ memberId: memberGames.memberId, gameId: memberGames.gameId })
		.from(memberGames)
		.where(eq(memberGames.academyId, ACADEMY_ID))
		.all();
	const feeRows: Array<{ memberId: string; month: string; amountDue: number }> =
		conn
			.select()
			.from(monthlyFees)
			.where(eq(monthlyFees.academyId, ACADEMY_ID))
			.all();
	const adjustmentRows = conn
		.select()
		.from(feeAdjustments)
		.where(eq(feeAdjustments.academyId, ACADEMY_ID))
		.orderBy(asc(sql`rowid`))
		.all();
	const visitRows: Array<{
		memberId: string;
		gameId: string;
		date: string;
		amount: number;
	}> = conn
		.select()
		.from(visitCharges)
		.where(eq(visitCharges.academyId, ACADEMY_ID))
		.all();
	const paymentRows = conn
		.select()
		.from(payments)
		.where(eq(payments.academyId, ACADEMY_ID))
		.orderBy(asc(sql`rowid`))
		.all();
	const logRows = conn
		.select()
		.from(memberStatusLogs)
		.where(eq(memberStatusLogs.academyId, ACADEMY_ID))
		.orderBy(asc(sql`rowid`))
		.all();

	const gamesById = new Map(gameRows.map((game) => [game.id, game]));

	const people = memberRows.map((member): PersonRecord => {
		const id: string = member.id;
		const memberGameList = linkRows
			.filter((link) => link.memberId === id)
			.map((link) => gamesById.get(link.gameId))
			.filter((game): game is GameRates => game !== undefined);

		const joinMonth = member.createdAt
			? localMonth(member.createdAt, tz)
			: currentMonth;

		let inactiveSince: string | null = null;
		if (member.status === "inactive") {
			const lastLog = logRows.filter((log) => log.memberId === id).at(-1);
			inactiveSince =
				lastLog?.status === "inactive" && lastLog.changedAt
					? localMonth(lastLog.changedAt, tz)
					: currentMonth;
		}

		const ledger: PersonLedger = {
			type: member.type,
			games: memberGameList,
			customMonthlyAmount: member.customMonthlyAmount ?? null,
			joinMonth,
			inactiveSince,
			frozen: feeRows
				.filter((row) => row.memberId === id)
				.map((row) => ({ month: row.month, amountDue: row.amountDue })),
			adjustments: adjustmentRows
				.filter((row) => row.memberId === id)
				.map((row) => ({
					month: row.month,
					amountAfter: row.amountAfter,
					action: row.action,
				})),
			visits: visitRows
				.filter((row) => row.memberId === id)
				.map((row) => ({
					date: row.date,
					amount: row.amount,
					label: `${gamesById.get(row.gameId)?.name ?? "Game"} visit`,
				})),
			payments: paymentRows
				.filter((row) => row.memberId === id)
				.map((row) => ({
					date: localDate(row.paidAt ?? new Date(), tz),
					amount: row.amount,
					reversal: row.reversalOfId !== null,
					label: row.notes ?? (row.reversalOfId ? "Reversal" : "Payment"),
				})),
		};

		return {
			id,
			name: member.name,
			type: member.type,
			batch: member.batch,
			contactNumber: member.contactNumber ?? null,
			address: member.address ?? null,
			status: member.status,
			customMonthlyAmount: ledger.customMonthlyAmount,
			joinMonth,
			inactiveSince,
			sports: memberGameList.map((game) => game.name),
			games: memberGameList,
			ledger,
		};
	});

	return { timezone: tz, currentMonth, people };
}
