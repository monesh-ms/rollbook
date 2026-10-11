import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { academies, games } from "../../db/schema";

const DEFAULT_ACADEMY_ID = "acad_ms_sports";

export const getSettings = createServerFn({ method: "GET" }).handler(
	async () => {
		const academyId = DEFAULT_ACADEMY_ID;

		const academy = await db
			.select()
			.from(academies)
			.where(eq(academies.id, academyId))
			.get();

		const gameRows = await db
			.select()
			.from(games)
			.where(eq(games.academyId, academyId));

		return {
			academy: academy || {
				id: academyId,
				name: "MS Sports Academy",
				timezone: "Asia/Kolkata",
				currency: "INR",
			},
			games: gameRows,
		};
	},
);

export const updateGameRates = createServerFn({ method: "POST" })
	.validator(
		(data: {
			games: Array<{
				id?: string;
				name: string;
				memberMonthlyAmount: number;
				studentMonthlyAmount: number;
				guestVisitAmount: number;
			}>;
		}) => data,
	)
	.handler(async ({ data }) => {
		const academyId = DEFAULT_ACADEMY_ID;

		for (const g of data.games) {
			if (g.id) {
				await db
					.update(games)
					.set({
						memberMonthlyAmount: g.memberMonthlyAmount,
						studentMonthlyAmount: g.studentMonthlyAmount,
						guestVisitAmount: g.guestVisitAmount,
					})
					.where(eq(games.id, g.id));
			} else {
				await db.insert(games).values({
					id: `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
					academyId,
					name: g.name,
					memberMonthlyAmount: g.memberMonthlyAmount,
					studentMonthlyAmount: g.studentMonthlyAmount,
					guestVisitAmount: g.guestVisitAmount,
				});
			}
		}

		return { success: true };
	});
