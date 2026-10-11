import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useTransition } from "react";
import { MobileHeader } from "../components/layout/mobile-header";
import { AcademyInfoCard } from "../components/settings/academy-info-card";
import { SportPricingCard } from "../components/settings/sport-pricing-card";
import { getSettings, updateGameRates } from "../lib/api/settings";

export const Route = createFileRoute("/settings")({
	loader: async () => {
		const data = await getSettings();
		return { data };
	},
	component: SettingsPage,
});

function SettingsPage() {
	const { data } = Route.useLoaderData();
	const router = useRouter();
	const [isSaving, startTransition] = useTransition();
	const [savedSuccess, setSavedSuccess] = useState(false);

	const handleSaveRate = async (
		updatedGame: Parameters<typeof updateGameRates>[0]["data"]["games"][0],
	) => {
		try {
			await updateGameRates({
				data: {
					games: [updatedGame],
				},
			});
			setSavedSuccess(true);
			setTimeout(() => setSavedSuccess(false), 3000);
			startTransition(() => {
				router.invalidate();
			});
		} catch (err) {
			console.error("Failed to update game rates:", err);
			alert("Error saving rate configuration");
		}
	};

	return (
		<div className="flex flex-col flex-1">
			<MobileHeader title="Settings" subtitle="Academy & Pricing Config" />

			<div className="p-4 space-y-4">
				{savedSuccess && (
					<div className="p-3 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
						Rates updated successfully! ✓
					</div>
				)}

				<AcademyInfoCard academy={data.academy} />

				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
							Sports Pricing & Fee Rules
						</span>
						<span className="text-[11px] font-medium text-muted-foreground">
							{data.games.length} Sports Active
						</span>
					</div>

					<div className="space-y-3">
						{data.games.map((game: any) => (
							<SportPricingCard
								key={game.id}
								game={game}
								onSave={handleSaveRate}
								isSaving={isSaving}
							/>
						))}
					</div>
				</div>

				<div className="p-4 rounded-xl border border-border bg-secondary/30 text-xs text-muted-foreground space-y-1.5">
					<div className="font-bold text-foreground">
						Data Storage & Integrity
					</div>
					<p>
						Operating on local SQLite via Bun. All changes to attendance and
						financial dues are persisted atomically with full audit history.
					</p>
				</div>
			</div>
		</div>
	);
}
