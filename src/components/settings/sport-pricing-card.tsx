import { useState } from "react";
import { formatInr, rupeesToPaise } from "../../lib/money";

export interface GameRate {
	id: string;
	name: string;
	memberMonthlyAmount: number;
	studentMonthlyAmount: number;
	guestVisitAmount: number;
}

interface SportPricingCardProps {
	game: GameRate;
	onSave: (updated: GameRate) => void;
	isSaving?: boolean;
}

export function SportPricingCard({
	game,
	onSave,
	isSaving,
}: SportPricingCardProps) {
	const [member, setMember] = useState(String(game.memberMonthlyAmount / 100));
	const [student, setStudent] = useState(
		String(game.studentMonthlyAmount / 100),
	);
	const [guest, setGuest] = useState(String(game.guestVisitAmount / 100));
	const [error, setError] = useState<string | null>(null);

	const dirty =
		member !== String(game.memberMonthlyAmount / 100) ||
		student !== String(game.studentMonthlyAmount / 100) ||
		guest !== String(game.guestVisitAmount / 100);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const memberMonthlyAmount = rupeesToPaise(member);
		const studentMonthlyAmount = rupeesToPaise(student);
		const guestVisitAmount = rupeesToPaise(guest);
		if (
			memberMonthlyAmount === null ||
			studentMonthlyAmount === null ||
			guestVisitAmount === null
		) {
			setError("Enter all three amounts in rupees.");
			return;
		}
		setError(null);
		onSave({
			...game,
			memberMonthlyAmount,
			studentMonthlyAmount,
			guestVisitAmount,
		});
	};

	const field = (label: string, value: string, set: (v: string) => void) => (
		<label className="block text-[11px] font-semibold text-muted-foreground">
			{label}
			<div className="relative mt-1">
				<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
					₹
				</span>
				<input
					name={`${game.name.toLowerCase()}-${label.toLowerCase().split(" ")[0]}`}
					type="text"
					inputMode="numeric"
					autoComplete="off"
					value={value}
					onChange={(e) => set(e.target.value)}
					className="w-full h-8 pl-5 pr-1.5 text-xs font-bold mono-num rounded-md border border-input bg-background text-foreground"
				/>
			</div>
		</label>
	);

	return (
		<form
			onSubmit={handleSubmit}
			className="p-4 rounded-xl border border-border bg-background flex flex-col gap-3"
		>
			<div className="flex items-center justify-between">
				<h4 className="text-sm font-bold text-foreground">{game.name}</h4>
				{dirty && (
					<span className="text-[11px] font-semibold text-amber-700">
						Not saved
					</span>
				)}
			</div>
			<div className="grid grid-cols-3 gap-2.5">
				{field("Member / month", member, setMember)}
				{field("Student / month", student, setStudent)}
				{field("Guest / visit", guest, setGuest)}
			</div>
			<p className="text-[11px] text-muted-foreground">
				Current: {formatInr(game.memberMonthlyAmount)} ·{" "}
				{formatInr(game.studentMonthlyAmount)} ·{" "}
				{formatInr(game.guestVisitAmount)}. A change applies to months not yet
				settled.
			</p>
			{error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
			<div className="flex justify-end">
				<button
					type="submit"
					disabled={!dirty || isSaving}
					className="h-8 px-3 text-xs font-bold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40"
				>
					{isSaving ? "Saving…" : "Save rates"}
				</button>
			</div>
		</form>
	);
}
