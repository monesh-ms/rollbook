import { X } from "lucide-react";
import { useState } from "react";

export interface PersonForm {
	name: string;
	type: "member" | "student" | "guest";
	batch: "morning" | "evening" | "both";
	gameIds: string[];
	contactNumber?: string;
	address?: string;
	customMonthlyAmount?: number;
}

interface PersonModalProps {
	title: string;
	submitLabel: string;
	initial?: PersonForm;
	games: Array<{ id: string; name: string }>;
	busy: boolean;
	error: string | null;
	onClose: () => void;
	onSubmit: (form: PersonForm) => void;
}

/**
 * Add or edit a person. Mount it only while open, so its fields start from `initial`.
 */
export function PersonModal({
	title,
	submitLabel,
	initial,
	games,
	busy,
	error,
	onClose,
	onSubmit,
}: PersonModalProps) {
	const [name, setName] = useState(initial?.name ?? "");
	const [type, setType] = useState<PersonForm["type"]>(
		initial?.type ?? "student",
	);
	const [batch, setBatch] = useState<PersonForm["batch"]>(
		initial?.batch ?? "morning",
	);
	const [gameIds, setGameIds] = useState<string[]>(
		initial?.gameIds ?? (games[0] ? [games[0].id] : []),
	);
	const [formError, setFormError] = useState<string | null>(null);

	const toggleGame = (gameId: string) => {
		setGameIds((current) =>
			current.includes(gameId)
				? current.filter((id) => id !== gameId)
				: [...current, gameId],
		);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			setFormError("Enter the person's name.");
			return;
		}
		if (gameIds.length === 0) {
			setFormError("Choose at least one game.");
			return;
		}
		setFormError(null);
		onSubmit({
			name: name.trim(),
			type,
			batch,
			gameIds,
			contactNumber: initial?.contactNumber,
			address: initial?.address,
			customMonthlyAmount: initial?.customMonthlyAmount,
		});
	};

	const field =
		"w-full h-9 px-3 mt-1 text-xs rounded-lg border border-input bg-background text-foreground font-normal";

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
			<div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto p-4 rounded-xl border border-border bg-background">
				<div className="flex items-center justify-between pb-3 border-b border-border">
					<span className="text-sm font-bold text-foreground">{title}</span>
					<button
						type="button"
						onClick={onClose}
						className="p-1 text-muted-foreground hover:text-foreground"
						aria-label="Close"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-3">
					<label className="block text-[11px] font-semibold text-muted-foreground">
						Full name
						<input
							name="name"
							type="text"
							autoComplete="off"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className={field}
						/>
					</label>

					<div className="grid grid-cols-2 gap-2">
						<label className="block text-[11px] font-semibold text-muted-foreground">
							Type
							<select
								name="type"
								value={type}
								onChange={(e) => setType(e.target.value as PersonForm["type"])}
								className={field}
							>
								<option value="student">Student (trained)</option>
								<option value="member">Member (plays regularly)</option>
								<option value="guest">Guest (per visit)</option>
							</select>
						</label>
						<label className="block text-[11px] font-semibold text-muted-foreground">
							Batch
							<select
								name="batch"
								value={batch}
								onChange={(e) =>
									setBatch(e.target.value as PersonForm["batch"])
								}
								className={field}
							>
								<option value="morning">Morning</option>
								<option value="evening">Evening</option>
								<option value="both">Both</option>
							</select>
						</label>
					</div>

					<fieldset>
						<legend className="text-[11px] font-semibold text-muted-foreground">
							Games
						</legend>
						<div className="mt-1 flex flex-wrap gap-2">
							{games.map((game) => (
								<label
									key={game.id}
									className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-input cursor-pointer"
								>
									<input
										type="checkbox"
										checked={gameIds.includes(game.id)}
										onChange={() => toggleGame(game.id)}
									/>
									{game.name}
								</label>
							))}
						</div>
					</fieldset>

					{(formError || error) && (
						<p role="alert" className="text-xs font-semibold text-rose-600">
							{formError ?? error}
						</p>
					)}

					<div className="flex justify-end gap-2 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-secondary"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={busy}
							className="px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40"
						>
							{busy ? "Saving…" : submitLabel}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
