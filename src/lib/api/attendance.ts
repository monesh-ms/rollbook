import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db";
import { attendance, games, memberGames, members } from "../../db/schema";
import { ACADEMY_ID } from "../academy";
import { monthOf, todayIn } from "../time";
import { requireAuth } from "./auth";
import { readAcademy } from "./data";
import { batch, calendarDate, personName, recordId } from "./schemas";

export type Mark = "present" | "absent" | null;

export interface RosterEntry {
	memberId: string;
	name: string;
	type: "member" | "student" | "guest";
	sports: string[];
	/** null means not marked for this session. That is not the same as absent. */
	status: Mark;
}

const dayQuery = z.object({ date: calendarDate.optional() }).optional();

/**
 * One read for the whole attendance screen: both rosters for a date, the
 * games for adding a guest, and the month's dots for the day picker.
 * Members and students appear in their batch. Guests only appear where they were added.
 */
export const getAttendanceDay = createServerFn({ method: "GET" })
	.validator(dayQuery)
	.handler(async ({ data }) => {
		await requireAuth();
		const academy = await readAcademy(db);
		const today = todayIn(academy.timezone);
		const date = data?.date ?? today;
		const month = monthOf(date);

		const memberRows = (await db
			.select()
			.from(members)
			.where(eq(members.academyId, ACADEMY_ID))
			.all()) as Array<typeof members.$inferSelect>;

		const sportRows: Array<{ memberId: string; gameName: string }> = (await db
			.select({ memberId: memberGames.memberId, gameName: games.name })
			.from(memberGames)
			.innerJoin(games, eq(memberGames.gameId, games.id))
			.where(eq(memberGames.academyId, ACADEMY_ID))
			.all()) as Array<{ memberId: string; gameName: string }>;

		const gameRows: Array<{ id: string; name: string }> = (await db
			.select({ id: games.id, name: games.name })
			.from(games)
			.where(eq(games.academyId, ACADEMY_ID))
			.all()) as Array<{ id: string; name: string }>;

		const monthMarks: Array<{
			date: string;
			batch: "morning" | "evening";
			memberId: string;
			status: "present" | "absent";
		}> = (await db
			.select({
				date: attendance.date,
				batch: attendance.batch,
				memberId: attendance.memberId,
				status: attendance.status,
			})
			.from(attendance)
			.where(
				and(
					eq(attendance.academyId, ACADEMY_ID),
					sql`${attendance.date} LIKE ${`${month}%`}`,
				),
			)
			.all()) as Array<typeof attendance.$inferSelect>;

		const markOf = new Map<string, "present" | "absent">();
		for (const mark of monthMarks) {
			if (mark.date === date) {
				markOf.set(`${mark.memberId}|${mark.batch}`, mark.status);
			}
		}

		const sportsOf = new Map<string, string[]>();
		for (const row of sportRows) {
			sportsOf.set(row.memberId, [
				...(sportsOf.get(row.memberId) ?? []),
				row.gameName,
			]);
		}

		const roster = (session: "morning" | "evening"): RosterEntry[] =>
			memberRows
				.filter((member) => {
					if (markOf.has(`${member.id}|${session}`)) return true;
					return (
						member.type !== "guest" &&
						member.status === "active" &&
						(member.batch === session || member.batch === "both")
					);
				})
				.map((member) => ({
					memberId: member.id,
					name: member.name,
					type: member.type,
					sports: sportsOf.get(member.id) ?? [],
					status: markOf.get(`${member.id}|${session}`) ?? null,
				}))
				.sort((a: RosterEntry, b: RosterEntry) => a.name.localeCompare(b.name));

		const dayCounts = new Map<string, { marked: number; present: number }>();
		for (const mark of monthMarks) {
			const count = dayCounts.get(mark.date) ?? { marked: 0, present: 0 };
			count.marked += 1;
			if (mark.status === "present") count.present += 1;
			dayCounts.set(mark.date, count);
		}

		return {
			date,
			month,
			today,
			morning: roster("morning"),
			evening: roster("evening"),
			dots: [...dayCounts.entries()].map(([day, count]) => ({
				date: day,
				markedCount: count.marked,
				presentCount: count.present,
			})),
			games: gameRows,
		};
	});

const markInput = z.object({
	date: calendarDate,
	batch,
	memberId: recordId,
	status: z.enum(["present", "absent", "clear"]),
});

/** Sets, changes or clears one mark. Repeating the same mark does nothing new. */
export const markAttendance = createServerFn({ method: "POST" })
	.validator(markInput)
	.handler(async ({ data }) => {
		await requireAuth();
		const member = await db
			.select({ id: members.id })
			.from(members)
			.where(
				and(eq(members.academyId, ACADEMY_ID), eq(members.id, data.memberId)),
			)
			.get();
		if (!member) throw new Error("Person not found");

		const session = and(
			eq(attendance.academyId, ACADEMY_ID),
			eq(attendance.date, data.date),
			eq(attendance.batch, data.batch),
			eq(attendance.memberId, data.memberId),
		);

		if (data.status === "clear") {
			await db.delete(attendance).where(session).run();
			return { success: true };
		}

		await db
			.insert(attendance)
			.values({
				id: `att_${crypto.randomUUID()}`,
				academyId: ACADEMY_ID,
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
				set: { status: data.status, markedAt: sql`(unixepoch())` },
			})
			.run();

		return { success: true };
	});

const guestInput = z.object({
	date: calendarDate,
	batch,
	name: personName,
	gameId: recordId,
});

/**
 * Adds a guest to one session and marks them present. A guest already saved under
 * the same name (ignoring case) is reused, so repeat visits stay on one record.
 */
export const addGuestToSession = createServerFn({ method: "POST" })
	.validator(guestInput)
	.handler(async ({ data }) => {
		await requireAuth();
		return await db.transaction(async (tx) => {
			const game = await tx
				.select({ id: games.id })
				.from(games)
				.where(and(eq(games.academyId, ACADEMY_ID), eq(games.id, data.gameId)))
				.get();
			if (!game) throw new Error("Game not found");

			let guest = await tx
				.select({ id: members.id })
				.from(members)
				.where(
					and(
						eq(members.academyId, ACADEMY_ID),
						eq(members.type, "guest"),
						sql`lower(${members.name}) = lower(${data.name})`,
					),
				)
				.get();

			if (!guest) {
				const memberId = `mem_${crypto.randomUUID()}`;
				await tx
					.insert(members)
					.values({
						id: memberId,
						academyId: ACADEMY_ID,
						name: data.name,
						type: "guest",
						batch: data.batch,
						status: "active",
					})
					.run();
				await tx
					.insert(memberGames)
					.values({
						id: `mg_${crypto.randomUUID()}`,
						academyId: ACADEMY_ID,
						memberId,
						gameId: data.gameId,
					})
					.run();
				guest = { id: memberId };
			}

			await tx
				.insert(attendance)
				.values({
					id: `att_${crypto.randomUUID()}`,
					academyId: ACADEMY_ID,
					date: data.date,
					batch: data.batch,
					memberId: guest.id,
					status: "present",
				})
				.onConflictDoUpdate({
					target: [
						attendance.academyId,
						attendance.date,
						attendance.batch,
						attendance.memberId,
					],
					set: { status: "present", markedAt: sql`(unixepoch())` },
				})
				.run();

			return { memberId: guest.id as string };
		});
	});
