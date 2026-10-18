import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import type { RosterEntry } from "../../lib/api/attendance";

interface AddGuestModalProps {
	batchLabel: string;
	games: Array<{ id: string; name: string }>;
	/** Guests already in this session, so each save is visible. */
	guests: RosterEntry[];
	busy: boolean;
	error: string | null;
	onClose: () => void;
	/** Resolves true when the guest is saved. The name is cleared only then. */
	onAdd: (name: string, gameId: string) => Promise<boolean>;
}

/**
 * Adds guests to one batch session. Stays open after each save so several guests
 * can be added in a row. Mount it only while open, so its fields start empty.
 */
export function AddGuestModal({
	batchLabel,
	games,
	guests,
	busy,
	error,
	onClose,
	onAdd,
}: AddGuestModalProps) {
	const [name, setName] = useState("");
	const [gameId, setGameId] = useState(games[0]?.id ?? "");
	const nameRef = useRef<HTMLInputElement>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed || !gameId || busy) return;
		const saved = await onAdd(trimmed, gameId);
		if (saved) {
			setName((current) => (current.trim() === trimmed ? "" : current));
		}
		nameRef.current?.focus();
	};

	const field =
		"w-full h-9 px-3 mt-1 text-xs rounded-lg border border-input bg-background text-foreground font-normal";

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
			<div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto p-4 rounded-xl border border-border bg-background">
				<div className="flex items-center justify-between pb-3 border-b border-border">
					<span className="text-sm font-bold text-foreground">
						Add guests · {batchLabel}
					</span>
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
						Guest name
						<input
							ref={nameRef}
							name="guest-name"
							type="text"
							autoComplete="off"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Guest name…"
							className={field}
						/>
					</label>

					<div className="flex items-end gap-2">
						<label className="flex-1 block text-[11px] font-semibold text-muted-foreground">
							Game
							<select
								name="guest-game"
								value={gameId}
								onChange={(e) => setGameId(e.target.value)}
								className={field}
							>
								{games.map((game) => (
									<option key={game.id} value={game.id}>
										{game.name}
									</option>
								))}
							</select>
						</label>
						<button
							type="submit"
							disabled={busy || !name.trim() || !gameId}
							className="flex items-center gap-1 h-9 px-3 text-xs font-bold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40"
						>
							<Plus className="w-3.5 h-3.5" />
							<span>{busy ? "Saving…" : "Add"}</span>
						</button>
					</div>

					{error && (
						<p role="alert" className="text-xs font-semibold text-rose-600">
							{error}
						</p>
					)}

					{guests.length > 0 && (
						<div>
							<p className="text-[11px] font-semibold text-muted-foreground">
								Guests in this session
							</p>
							<ul className="mt-1 divide-y divide-border/70 rounded-lg border border-border">
								{guests.map((guest) => (
									<li
										key={guest.memberId}
										className="flex items-center justify-between gap-2 px-3 py-2 text-xs"
									>
										<span className="font-semibold text-foreground truncate">
											{guest.name}
										</span>
										<span className="shrink-0 text-muted-foreground">
											{guest.sports.join(" & ")}
										</span>
									</li>
								))}
							</ul>
						</div>
					)}

					<div className="flex justify-end pt-1">
						<button
							type="button"
							onClick={onClose}
							className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-secondary"
						>
							Done
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
