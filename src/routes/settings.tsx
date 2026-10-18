import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { MobileHeader } from "../components/layout/mobile-header";
import { AcademyInfoCard } from "../components/settings/academy-info-card";
import {
	AddGameForm,
	type NewGame,
} from "../components/settings/add-game-form";
import {
	type GameRate,
	SportPricingCard,
} from "../components/settings/sport-pricing-card";
import { Notice } from "../components/ui/notice";
import { getSettings, updateGameRates } from "../lib/api/settings";
import { errorText } from "../lib/money";

export const Route = createFileRoute("/settings")({
	loader: () => getSettings(),
	component: SettingsPage,
});

function SettingsPage() {
	const data = Route.useLoaderData();
	const router = useRouter();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState<string | null>(null);

	const save = async (
		games: Array<Partial<GameRate> & NewGame>,
		message: string,
	) => {
		setError(null);
		setSaved(null);
		setBusy(true);
		try {
			await updateGameRates({ data: { games } });
			setSaved(message);
			await router.invalidate();
		} catch (err) {
			setError(errorText(err));
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="flex flex-col flex-1">
			<MobileHeader title="Settings" subtitle="Academy and game rates" />

			<div className="p-4 space-y-4">
				{error && <Notice>{error}</Notice>}
				{saved && <Notice tone="success">{saved}</Notice>}

				<AcademyInfoCard academy={data.academy} />

				<div className="space-y-3">
					<h3 className="text-xs font-bold text-foreground">Games and rates</h3>
					{data.games.map((game) => (
						<SportPricingCard
							key={game.id}
							game={game}
							isSaving={busy}
							onSave={(updated) =>
								void save(
									[
										{
											id: updated.id,
											name: updated.name,
											memberMonthlyAmount: updated.memberMonthlyAmount,
											studentMonthlyAmount: updated.studentMonthlyAmount,
											guestVisitAmount: updated.guestVisitAmount,
										},
									],
									`${game.name} rates saved.`,
								)
							}
						/>
					))}
					<AddGameForm
						busy={busy}
						onAdd={(game) => void save([game], `${game.name} added.`)}
					/>
				</div>
			</div>
		</div>
	);
}
