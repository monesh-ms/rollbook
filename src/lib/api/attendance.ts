import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { attendance, games, memberGames, members } from "../../db/schema";

const DEFAULT_ACADEMY_ID = "acad_ms_sports";

export interface AttendeeRecord {
	id: string;
	memberId: string;
	name: string;
	type: "member" | "student" | "guest";
	batch: "morning" | "evening" | "both";
	sports: string[];
	status: "present" | "absent";
}

export const getAttendanceByDate = createServerFn({ method: "GET" })
	.validator((data: { date: string }) => data)
	.handler(async ({ data }) => {
		const academyId = DEFAULT_ACADEMY_ID;
		const targetDate = data.date; // e.g. '2026-10-11'

		// 1. Fetch all attendance marks for this date
		const marks = await db
			.select()
			.from(attendance)
			.where(
				and(
					eq(attendance.academyId, academyId),
					eq(attendance.date, targetDate),
				),
			);

		const marksMap = new Map<string, "present" | "absent">();
		for (const m of marks) {
			marksMap.set(
				`${m.memberId}_${m.batch}`,
				m.status as "present" | "absent",
			);
		}

		// 2. Fetch all members for this academy
		const allMembers = await db
			.select()
			.from(members)
			.where(eq(members.academyId, academyId));

		const memberSportsMap = new Map<string, string[]>();
		const sportRows = await db
			.select({
				memberId: memberGames.memberId,
				gameName: games.name,
			})
			.from(memberGames)
			.innerJoin(games, eq(memberGames.gameId, games.id))
			.where(eq(memberGames.academyId, academyId));

		for (const row of sportRows) {
			const list = memberSportsMap.get(row.memberId) || [];
			list.push(row.gameName);
			memberSportsMap.set(row.memberId, list);
		}

		// 3. Populate morning and evening rosters
		const morningRoster: AttendeeRecord[] = [];
		const eveningRoster: AttendeeRecord[] = [];

		for (const member of allMembers) {
			const sportsList = memberSportsMap.get(member.id) || [];

			// Check morning
			const morningMark = marksMap.get(`${member.id}_morning`);
			if (
				morningMark ||
				((member.batch === "morning" || member.batch === "both") &&
					member.status === "active")
			) {
				morningRoster.push({
					id: `${member.id}_morning`,
					memberId: member.id,
					name: member.name,
					type: member.type as "member" | "student" | "guest",
					batch: member.batch as "morning" | "evening" | "both",
					sports: sportsList,
					status: morningMark || "absent",
				});
			}

			// Check evening
			const eveningMark = marksMap.get(`${member.id}_evening`);
			if (
				eveningMark ||
				((member.batch === "evening" || member.batch === "both") &&
					member.status === "active")
			) {
				eveningRoster.push({
					id: `${member.id}_evening`,
					memberId: member.id,
					name: member.name,
					type: member.type as "member" | "student" | "guest",
					batch: member.batch as "morning" | "evening" | "both",
					sports: sportsList,
					status: eveningMark || "absent",
				});
			}
		}

		const presentCount = marks.filter(
			(m: { status: string }) => m.status === "present",
		).length;
		const absentCount = marks.filter(
			(m: { status: string }) => m.status === "absent",
		).length;

		return {
			date: targetDate,
			summary: {
				totalMarked: marks.length,
				presentCount,
				absentCount,
			},
			morning: morningRoster,
			evening: eveningRoster,
		};
	});

export const markAttendance = createServerFn({ method: "POST" })
	.validator(
		(data: {
			date: string;
			batch: "morning" | "evening";
			memberId: string;
			status: "present" | "absent";
		}) => data,
	)
	.handler(async ({ data }) => {
		const academyId = DEFAULT_ACADEMY_ID;
		const markId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

		// Idempotent upsert on (academy_id, date, batch, member_id)
		await db
			.insert(attendance)
			.values({
				id: markId,
				academyId,
				date: data.date,
				batch: data.batch,
				memberId: data.memberId,
				status: data.status,
			})
			.onConflictDoUpdate({
				target: [
					attendance.academyId,
					attendance.date,
					attendance.batch,
					attendance.memberId,
				],
				set: {
					status: data.status,
					markedAt: sql`(unixepoch())`,
				},
			});

		return { success: true };
	});

export const quickAddAttendee = createServerFn({ method: "POST" })
	.validator(
		(data: {
			name: string;
			batch: "morning" | "evening";
			date: string;
			isGuest?: boolean;
		}) => data,
	)
	.handler(async ({ data }) => {
		const academyId = DEFAULT_ACADEMY_ID;
		const memberId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

		await db.insert(members).values({
			id: memberId,
			academyId,
			name: data.name,
			type: data.isGuest ? "guest" : "member",
			batch: data.batch,
			status: "active",
		});

		const defaultGame = await db
			.select()
			.from(games)
			.where(eq(games.academyId, academyId))
			.get();
		if (defaultGame) {
			await db.insert(memberGames).values({
				id: `mg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
				academyId,
				memberId,
				gameId: defaultGame.id,
			});
		}

		const markId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
		await db.insert(attendance).values({
			id: markId,
			academyId,
			date: data.date,
			batch: data.batch,
			memberId,
			status: "present",
		});

		return { success: true, memberId };
	});

export const getMonthAttendanceDots = createServerFn({ method: "GET" })
	.validator((data: { month: string }) => data)
	.handler(async ({ data }) => {
		const academyId = DEFAULT_ACADEMY_ID;
		const rows = await db
			.select({
				date: attendance.date,
				status: attendance.status,
			})
			.from(attendance)
			.where(
				and(
					eq(attendance.academyId, academyId),
					sql`${attendance.date} LIKE ${data.month + "%"}`,
				),
			);

		const dayCounts = new Map<string, { present: number; total: number }>();

		for (const r of rows) {
			const curr = dayCounts.get(r.date) || { present: 0, total: 0 };
			curr.total += 1;
			if (r.status === "present") curr.present += 1;
			dayCounts.set(r.date, curr);
		}

		return Array.from(dayCounts.entries()).map(([date, counts]) => ({
			date,
			hasSessions: counts.total > 0,
			presentCount: counts.present,
		}));
	});
