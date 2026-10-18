import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db";
import { games } from "../../db/schema";
import { ACADEMY_ID } from "../academy";
import { readAcademy } from "./data";
import { paise, recordId } from "./schemas";

export const getSettings = createServerFn({ method: "GET" }).handler(
	async () => {
		const academy = readAcademy(db);
		const gameRows = db
			.select()
			.from(games)
			.where(eq(games.academyId, ACADEMY_ID))
			.orderBy(asc(games.name))
			.all() as Array<typeof games.$inferSelect>;
		return { academy, games: gameRows };
	},
);

const gameInput = z.object({
	id: recordId.optional(),
	name: z.string().trim().min(1, "Game name is required").max(40),
	memberMonthlyAmount: paise,
	studentMonthlyAmount: paise,
	guestVisitAmount: paise,
});

const ratesInput = z.object({ games: z.array(gameInput).min(1).max(50) });

/**
 * Saves game rates. A rate change applies to unsettled months only; settled months
 * keep the amount they were paid at.
 */
export const updateGameRates = createServerFn({ method: "POST" })
	.validator(ratesInput)
	.handler(async ({ data }) => {
		return db.transaction((tx) => {
			for (const game of data.games) {
				const rates = {
					memberMonthlyAmount: game.memberMonthlyAmount,
					studentMonthlyAmount: game.studentMonthlyAmount,
					guestVisitAmount: game.guestVisitAmount,
				};
				if (game.id) {
					const existing = tx
						.select({ id: games.id })
						.from(games)
						.where(and(eq(games.academyId, ACADEMY_ID), eq(games.id, game.id)))
						.get();
					if (!existing) throw new Error("Game not found");
					tx.update(games)
						.set({ name: game.name, ...rates })
						.where(eq(games.id, game.id))
						.run();
				} else {
					tx.insert(games)
						.values({
							id: `game_${crypto.randomUUID()}`,
							academyId: ACADEMY_ID,
							name: game.name,
							...rates,
						})
						.run();
				}
			}
			return { success: true };
		});
	});
