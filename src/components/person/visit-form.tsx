import { useState } from "react";
import { rupeesToPaise } from "../../lib/money";

export interface VisitInput {
	date: string;
	gameId: string;
	amount: number;
}

interface VisitFormProps {
	games: Array<{ id: string; name: string; guestVisitAmount: number }>;
	today: string;
	busy: boolean;
	onSubmit: (input: VisitInput) => void;
}

/** One visit charge. The amount starts at the game's guest rate and can be changed. */
export function VisitForm({ games, today, busy, onSubmit }: VisitFormProps) {
	const [date, setDate] = useState(today);
	const [gameId, setGameId] = useState(games[0]?.id ?? "");
	const selected = games.find((game) => game.id === gameId);
	const [amount, setAmount] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const shownAmount =
		amount ?? (selected ? String(selected.guestVisitAmount / 100) : "");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const paise = rupeesToPaise(shownAmount);
		if (!date) {
			setError("Pick the visit date.");
			return;
		}
		if (!gameId) {
			setError("Choose the game.");
			return;
		}
		if (paise === null || paise <= 0) {
			setError("Enter the visit amount in rupees, more than zero.");
			return;
		}
		setError(null);
		onSubmit({ date, gameId, amount: paise });
		setAmount(null);
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-2">
			<div className="grid grid-cols-2 gap-2">
				<label className="text-xs font-semibold text-muted-foreground">
					Visit date
					<input
						name="visit-date"
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
						className="mt-1 w-full h-9 px-2 text-xs rounded-lg border border-input bg-background text-foreground"
					/>
				</label>
				<label className="text-xs font-semibold text-muted-foreground">
					Game
					<select
						name="visit-game"
						value={gameId}
						onChange={(e) => {
							setGameId(e.target.value);
							setAmount(null);
						}}
						className="mt-1 w-full h-9 px-2 text-xs rounded-lg border border-input bg-background text-foreground"
					>
						{games.map((game) => (
							<option key={game.id} value={game.id}>
								{game.name}
							</option>
						))}
					</select>
				</label>
			</div>
			<div className="flex items-end gap-2">
				<label className="flex-1 text-xs font-semibold text-muted-foreground">
					Visit amount (₹)
					<input
						name="visit-amount"
						type="text"
						inputMode="numeric"
						autoComplete="off"
						value={shownAmount}
						onChange={(e) => setAmount(e.target.value)}
						className="mt-1 w-full h-9 px-2.5 text-xs font-bold mono-num rounded-lg border border-input bg-background text-foreground"
					/>
				</label>
				<button
					type="submit"
					disabled={busy}
					className="h-9 px-3 text-xs font-bold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40"
				>
					Add visit
				</button>
			</div>
			{error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
		</form>
	);
}
