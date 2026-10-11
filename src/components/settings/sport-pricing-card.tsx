import { useState } from "react";

interface GameRate {
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
	const [memberRate, setMemberRate] = useState(
		String(game.memberMonthlyAmount / 100),
	);
	const [studentRate, setStudentRate] = useState(
		String(game.studentMonthlyAmount / 100),
	);
	const [guestRate, setGuestRate] = useState(
		String(game.guestVisitAmount / 100),
	);
	const [hasChanged, setHasChanged] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSave({
			...game,
			memberMonthlyAmount:
				Math.round(parseFloat(memberRate) * 100) || game.memberMonthlyAmount,
			studentMonthlyAmount:
				Math.round(parseFloat(studentRate) * 100) || game.studentMonthlyAmount,
			guestVisitAmount:
				Math.round(parseFloat(guestRate) * 100) || game.guestVisitAmount,
		});
		setHasChanged(false);
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="p-4 rounded-xl border border-border bg-background shadow-xs flex flex-col gap-3"
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-sm">
						{game.name.charAt(0)}
					</div>
					<div>
						<h4 className="text-sm font-bold text-foreground">{game.name}</h4>
						<p className="text-[11px] text-muted-foreground">
							Standard monthly & guest visit rates
						</p>
					</div>
				</div>
				{hasChanged && (
					<span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
						Unsaved changes
					</span>
				)}
			</div>

			<div className="grid grid-cols-3 gap-2.5 pt-1">
				<label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
					Member / Mo
					<div className="relative mt-1">
						<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
							₹
						</span>
						<input
							type="number"
							value={memberRate}
							onChange={(e) => {
								setMemberRate(e.target.value);
								setHasChanged(true);
							}}
							className="w-full h-8 pl-5 pr-1.5 text-xs font-bold mono-num rounded-md border border-input bg-background text-foreground font-normal"
						/>
					</div>
				</label>

				<label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
					Student / Mo
					<div className="relative mt-1">
						<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
							₹
						</span>
						<input
							type="number"
							value={studentRate}
							onChange={(e) => {
								setStudentRate(e.target.value);
								setHasChanged(true);
							}}
							className="w-full h-8 pl-5 pr-1.5 text-xs font-bold mono-num rounded-md border border-input bg-background text-foreground font-normal"
						/>
					</div>
				</label>

				<label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
					Guest / Visit
					<div className="relative mt-1">
						<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
							₹
						</span>
						<input
							type="number"
							value={guestRate}
							onChange={(e) => {
								setGuestRate(e.target.value);
								setHasChanged(true);
							}}
							className="w-full h-8 pl-5 pr-1.5 text-xs font-bold mono-num rounded-md border border-input bg-background text-foreground font-normal"
						/>
					</div>
				</label>
			</div>

			<div className="flex justify-end pt-1">
				<button
					type="submit"
					disabled={!hasChanged || isSaving}
					className="h-8 px-3 text-xs font-bold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40 transition-colors shadow-xs"
				>
					{isSaving ? "Saving..." : "Update Rates"}
				</button>
			</div>
		</form>
	);
}
