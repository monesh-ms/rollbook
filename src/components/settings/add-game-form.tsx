import { useState } from "react";
import { rupeesToPaise } from "../../lib/money";

export interface NewGame {
	name: string;
	memberMonthlyAmount: number;
	studentMonthlyAmount: number;
	guestVisitAmount: number;
}

interface AddGameFormProps {
	busy: boolean;
	onAdd: (game: NewGame) => void;
}

export function AddGameForm({ busy, onAdd }: AddGameFormProps) {
	const [name, setName] = useState("");
	const [member, setMember] = useState("");
	const [student, setStudent] = useState("");
	const [guest, setGuest] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const memberMonthlyAmount = rupeesToPaise(member);
		const studentMonthlyAmount = rupeesToPaise(student);
		const guestVisitAmount = rupeesToPaise(guest);
		if (!name.trim()) {
			setError("Enter the game's name.");
			return;
		}
		if (
			memberMonthlyAmount === null ||
			studentMonthlyAmount === null ||
			guestVisitAmount === null
		) {
			setError("Enter all three amounts in rupees.");
			return;
		}
		setError(null);
		onAdd({
			name: name.trim(),
			memberMonthlyAmount,
			studentMonthlyAmount,
			guestVisitAmount,
		});
		setName("");
		setMember("");
		setStudent("");
		setGuest("");
	};

	const field =
		"w-full h-9 px-2.5 mt-1 text-xs font-bold mono-num rounded-lg border border-input bg-background text-foreground";

	return (
		<form
			onSubmit={handleSubmit}
			className="p-4 rounded-xl border border-dashed border-border flex flex-col gap-3"
		>
			<span className="text-sm font-bold text-foreground">Add a game</span>
			<label className="block text-[11px] font-semibold text-muted-foreground">
				Name
				<input
					name="new-game-name"
					type="text"
					autoComplete="off"
					value={name}
					onChange={(e) => setName(e.target.value)}
					className={field}
				/>
			</label>
			<div className="grid grid-cols-3 gap-2">
				<label className="block text-[11px] font-semibold text-muted-foreground">
					Member / month
					<input
						name="new-game-member"
						type="text"
						inputMode="numeric"
						autoComplete="off"
						value={member}
						onChange={(e) => setMember(e.target.value)}
						className={field}
					/>
				</label>
				<label className="block text-[11px] font-semibold text-muted-foreground">
					Student / month
					<input
						name="new-game-student"
						type="text"
						inputMode="numeric"
						autoComplete="off"
						value={student}
						onChange={(e) => setStudent(e.target.value)}
						className={field}
					/>
				</label>
				<label className="block text-[11px] font-semibold text-muted-foreground">
					Guest / visit
					<input
						name="new-game-guest"
						type="text"
						inputMode="numeric"
						autoComplete="off"
						value={guest}
						onChange={(e) => setGuest(e.target.value)}
						className={field}
					/>
				</label>
			</div>
			{error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
			<div className="flex justify-end">
				<button
					type="submit"
					disabled={busy}
					className="h-8 px-3 text-xs font-bold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40"
				>
					Add game
				</button>
			</div>
		</form>
	);
}
