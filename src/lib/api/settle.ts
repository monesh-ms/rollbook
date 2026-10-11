import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import {
	attendance,
	games,
	memberGames,
	members,
	monthlyFees,
	payments,
	visitCharges,
} from "../../db/schema";

const DEFAULT_ACADEMY_ID = "acad_ms_sports";

export interface SettleAccount {
	memberId: string;
	name: string;
	type: "member" | "student";
	sports: string[];
	batch: "morning" | "evening" | "both";
	currentMonthFee: number;
	priorArrears: number;
	totalSuggested: number;
	isCustomRate: boolean;
	feeStatus: "standard" | "waived_no_fee" | "switched_to_visits";
	hasAttendanceThisMonth: boolean;
}

export const getMonthSettlement = createServerFn({ method: "GET" })
	.validator((data: { month: string }) => data)
	.handler(async ({ data }) => {
		const academyId = DEFAULT_ACADEMY_ID;
		const targetMonth = data.month; // e.g. '2026-10'

		// 1. Fetch all monthly fees for the target month
		const feeRows = await db
			.select()
			.from(monthlyFees)
			.where(
				and(
					eq(monthlyFees.academyId, academyId),
					eq(monthlyFees.month, targetMonth),
				),
			);

		// Also include inactive members who have open arrears from earlier months
		const allMembers = await db
			.select()
			.from(members)
			.where(and(eq(members.academyId, academyId)));

		// Map sports
		const sportRows = await db
			.select({
				memberId: memberGames.memberId,
				gameName: games.name,
			})
			.from(memberGames)
			.innerJoin(games, eq(memberGames.gameId, games.id));

		const memberSportsMap = new Map<string, string[]>();
		for (const r of sportRows) {
			const list = memberSportsMap.get(r.memberId) || [];
			list.push(r.gameName);
			memberSportsMap.set(r.memberId, list);
		}

		// Attendance check for target month
		const attRows = await db
			.select({ memberId: attendance.memberId })
			.from(attendance)
			.where(
				and(
					eq(attendance.academyId, academyId),
					sql`${attendance.date} LIKE ${targetMonth + "%"}`,
				),
			);

		const attendedSet = new Set(
			attRows.map((a: { memberId: string }) => a.memberId),
		);

		// Calculate carryover: prior fees minus prior payments
		const accounts: SettleAccount[] = [];
		let totalDueSum = 0;
		let totalArrearsSum = 0;

		for (const m of allMembers) {
			if (m.type === "guest") continue; // Guests never appear on monthly settle list

			// Target month fee
			const targetFee = feeRows.find(
				(f: { memberId: string }) => f.memberId === m.id,
			);
			const currentMonthFee = targetFee ? targetFee.amountDue : 0;
			const feeStatus = targetFee ? (targetFee.status as any) : "standard";

			// Prior fees: all fees before targetMonth
			const priorFees = await db
				.select({
					total: sql<number>`COALESCE(SUM(${monthlyFees.amountDue}), 0)`,
				})
				.from(monthlyFees)
				.where(
					and(
						eq(monthlyFees.academyId, academyId),
						eq(monthlyFees.memberId, m.id),
						sql`${monthlyFees.month} < ${targetMonth}`,
					),
				);

			// Total payments recorded before or during targetMonth
			const totalPayments = await db
				.select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
				.from(payments)
				.where(
					and(eq(payments.academyId, academyId), eq(payments.memberId, m.id)),
				);

			const priorFeeTotal = priorFees[0]?.total || 0;
			const paidTotal = totalPayments[0]?.total || 0;

			// Prior arrears is whatever earlier debt remains
			const priorArrears = Math.max(0, priorFeeTotal - paidTotal);
			const totalSuggested = currentMonthFee + priorArrears;

			// If nothing is owed and current month is not open, skip
			if (totalSuggested <= 0) continue;

			totalDueSum += totalSuggested;
			totalArrearsSum += priorArrears;

			accounts.push({
				memberId: m.id,
				name: m.name,
				type: m.type as "member" | "student",
				sports: memberSportsMap.get(m.id) || [],
				batch: m.batch,
				currentMonthFee,
				priorArrears,
				totalSuggested,
				isCustomRate: m.customMonthlyAmount != null,
				feeStatus,
				hasAttendanceThisMonth: attendedSet.has(m.id),
			});
		}

		return {
			month: targetMonth,
			summary: {
				totalDue: totalDueSum,
				priorArrears: totalArrearsSum,
				unsettledCount: accounts.length,
			},
			accounts,
		};
	});

export const recordPayment = createServerFn({ method: "POST" })
	.validator(
		(data: {
			memberId: string;
			amount: number;
			paymentMethod: "cash" | "upi" | "other";
			notes?: string;
		}) => data,
	)
	.handler(async ({ data }) => {
		const academyId = DEFAULT_ACADEMY_ID;
		const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

		await db.insert(payments).values({
			id: paymentId,
			academyId,
			memberId: data.memberId,
			amount: data.amount,
			paymentMethod: data.paymentMethod,
			notes: data.notes,
		});

		return { success: true, paymentId };
	});

export const recordGuestVisitAndPayment = createServerFn({ method: "POST" })
	.validator(
		(data: {
			memberId: string;
			date: string;
			gameId: string;
			collectPaymentNow: boolean;
			paymentMethod?: "cash" | "upi";
		}) => data,
	)
	.handler(async ({ data }) => {
		const academyId = DEFAULT_ACADEMY_ID;

		// 1. Fetch game visit rate
		const gameRow = await db
			.select()
			.from(games)
			.where(eq(games.id, data.gameId))
			.get();
		const rate = gameRow ? gameRow.guestVisitAmount : 40000;

		const chargeId = `vc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

		await db.insert(visitCharges).values({
			id: chargeId,
			academyId,
			memberId: data.memberId,
			date: data.date,
			gameId: data.gameId,
			amount: rate,
			notes: "Guest visit charge on arrival",
		});

		let paymentId: string | undefined;
		if (data.collectPaymentNow) {
			paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
			await db.insert(payments).values({
				id: paymentId,
				academyId,
				memberId: data.memberId,
				amount: rate,
				paymentMethod: data.paymentMethod || "upi",
				notes: "Guest visit on-the-spot collection",
			});
		}

		return { success: true, chargeId, amount: rate, paymentId };
	});

export const adjustMonthlyFee = createServerFn({ method: "POST" })
	.validator(
		(data: {
			memberId: string;
			month: string;
			action: "waive_no_fee" | "switch_to_visits";
			visitCount?: number;
		}) => data,
	)
	.handler(async ({ data }) => {
		const academyId = DEFAULT_ACADEMY_ID;

		const isWaive = data.action === "waive_no_fee";
		const count = data.visitCount || 1;
		await db
			.update(monthlyFees)
			.set(
				isWaive
					? {
							amountDue: 0,
							status: "waived_no_fee",
							notes: "Fee waived by management",
						}
					: {
							amountDue: count * 40000,
							status: "switched_to_visits",
							notes: `Switched to ${count} visit charges`,
						},
			)
			.where(
				and(
					eq(monthlyFees.academyId, academyId),
					eq(monthlyFees.memberId, data.memberId),
					eq(monthlyFees.month, data.month),
				),
			);

		return { success: true };
	});

export const reversePayment = createServerFn({ method: "POST" })
	.validator((data: { paymentId: string; reason?: string }) => data)
	.handler(async ({ data }) => {
		const original = await db
			.select()
			.from(payments)
			.where(eq(payments.id, data.paymentId))
			.get();
		if (!original) throw new Error("Payment not found");

		const reversalId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		await db.insert(payments).values({
			id: reversalId,
			academyId: DEFAULT_ACADEMY_ID,
			memberId: original.memberId,
			amount: original.amount,
			paymentMethod: original.paymentMethod,
			reversalOfId: original.id,
			notes: data.reason || `Reversal of payment #${original.id}`,
		});
		return { success: true, reversalId };
	});
