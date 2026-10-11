import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db";
import {
	games,
	memberGames,
	memberStatusLogs,
	members,
	monthlyFees,
	payments,
	visitCharges,
} from "../../db/schema";

const DEFAULT_ACADEMY_ID = "acad_ms_sports";

export const getMembers = createServerFn({ method: "GET" })
	.validator(
		(data?: { search?: string; type?: string; status?: string }) => data || {},
	)
	.handler(async () => {
		const academyId = DEFAULT_ACADEMY_ID;

		// Fetch members
		const memberRows = await db
			.select()
			.from(members)
			.where(eq(members.academyId, academyId));

		// Fetch sports
		const sportRows = await db
			.select({
				memberId: memberGames.memberId,
				gameId: games.id,
				gameName: games.name,
			})
			.from(memberGames)
			.innerJoin(games, eq(memberGames.gameId, games.id));

		const memberSportsMap = new Map<
			string,
			Array<{ id: string; name: string }>
		>();
		for (const r of sportRows) {
			const list = memberSportsMap.get(r.memberId) || [];
			list.push({ id: r.gameId, name: r.gameName });
			memberSportsMap.set(r.memberId, list);
		}

		const mapped = memberRows.map((m: any) => ({
			...m,
			sports: memberSportsMap.get(m.id) || [],
		}));

		const totalActive = mapped.filter((m: any) => m.status === "active").length;

		return {
			members: mapped,
			summary: {
				total: mapped.length,
				totalActive,
			},
		};
	});

export const registerMember = createServerFn({ method: "POST" })
	.validator(
		(data: {
			name: string;
			type: "member" | "student" | "guest";
			batch: "morning" | "evening" | "both";
			gameIds: string[];
			contactNumber?: string;
			address?: string;
			customMonthlyAmount?: number;
		}) => data,
	)
	.handler(async ({ data }) => {
		const academyId = DEFAULT_ACADEMY_ID;
		const memberId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

		await db.insert(members).values({
			id: memberId,
			academyId,
			name: data.name,
			type: data.type,
			batch: data.batch,
			contactNumber: data.contactNumber,
			address: data.address,
			status: "active",
			customMonthlyAmount: data.customMonthlyAmount,
		});

		for (const gameId of data.gameIds) {
			await db.insert(memberGames).values({
				id: `mg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
				academyId,
				memberId,
				gameId,
			});
		}

		return { success: true, memberId };
	});

export const getMemberLedger = createServerFn({ method: "GET" })
	.validator((data: { memberId: string }) => data)
	.handler(async ({ data }) => {
		const academyId = DEFAULT_ACADEMY_ID;

		const member = await db
			.select()
			.from(members)
			.where(
				and(eq(members.academyId, academyId), eq(members.id, data.memberId)),
			)
			.get();

		if (!member) throw new Error("Member not found");

		// Fetch member sports
		const sportRows = await db
			.select({ gameName: games.name })
			.from(memberGames)
			.innerJoin(games, eq(memberGames.gameId, games.id))
			.where(eq(memberGames.memberId, data.memberId));

		// Monthly fees
		const fees = await db
			.select()
			.from(monthlyFees)
			.where(
				and(
					eq(monthlyFees.academyId, academyId),
					eq(monthlyFees.memberId, data.memberId),
				),
			);

		// Visit charges
		const visits = await db
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
					eq(visitCharges.academyId, academyId),
					eq(visitCharges.memberId, data.memberId),
				),
			);

		// Payments
		const payRows = await db
			.select()
			.from(payments)
			.where(
				and(
					eq(payments.academyId, academyId),
					eq(payments.memberId, data.memberId),
				),
			)
			.orderBy(desc(payments.paidAt));

		// Aggregate ledger items
		const ledgerItems: Array<{
			id: string;
			date: string;
			type: "monthly_fee" | "visit_charge" | "payment" | "reversal";
			description: string;
			amount: number;
			isCredit: boolean;
		}> = [];

		for (const f of fees) {
			ledgerItems.push({
				id: f.id,
				date: `${f.month}-01`,
				type: "monthly_fee",
				description: `Monthly Fee (${f.month})`,
				amount: f.amountDue,
				isCredit: false,
			});
		}

		for (const v of visits) {
			ledgerItems.push({
				id: v.id,
				date: v.date,
				type: "visit_charge",
				description: `${v.gameName} Visit Charge`,
				amount: v.amount,
				isCredit: false,
			});
		}

		for (const p of payRows) {
			ledgerItems.push({
				id: p.id,
				date: p.paidAt
					? new Date(p.paidAt).toISOString().split("T")[0]
					: "2026-10-11",
				type: p.reversalOfId ? "reversal" : "payment",
				description:
					p.notes || (p.reversalOfId ? "Payment Reversal" : "Payment Received"),
				amount: p.amount,
				isCredit: !p.reversalOfId,
			});
		}

		// Sort descending by date
		ledgerItems.sort((a, b) => b.date.localeCompare(a.date));

		const totalDebits =
			fees.reduce(
				(acc: number, f: { amountDue: number }) => acc + f.amountDue,
				0,
			) +
			visits.reduce((acc: number, v: { amount: number }) => acc + v.amount, 0);
		const totalCredits = payRows.reduce(
			(acc: number, p: { amount: number; reversalOfId: string | null }) =>
				acc + (p.reversalOfId ? -p.amount : p.amount),
			0,
		);
		const currentBalanceOwed = Math.max(0, totalDebits - totalCredits);

		return {
			member: {
				...member,
				sports: sportRows.map((s: { gameName: string }) => s.gameName),
			},
			currentBalanceOwed,
			ledger: ledgerItems,
		};
	});

export const updateMemberStatus = createServerFn({ method: "POST" })
	.validator(
		(data: {
			memberId: string;
			status: "active" | "inactive";
			reason?: string;
		}) => data,
	)
	.handler(async ({ data }) => {
		const academyId = DEFAULT_ACADEMY_ID;

		await db
			.update(members)
			.set({ status: data.status })
			.where(
				and(eq(members.academyId, academyId), eq(members.id, data.memberId)),
			);

		await db.insert(memberStatusLogs).values({
			id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
			academyId,
			memberId: data.memberId,
			status: data.status,
			reason: data.reason || "Status updated by management",
		});

		return { success: true };
	});
