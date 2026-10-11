import { useState } from "react";

interface FeeActionCardProps {
	memberId: string;
	suggestedBalancePaise: number;
	onCollectPayment: (amountPaise: number) => void;
	onWaiveFee: () => void;
	onSwitchToVisits: (count: number) => void;
	onToggleStatus: (newStatus: "active" | "inactive") => void;
	isInactive: boolean;
}

export function FeeActionCard({
	suggestedBalancePaise,
	onCollectPayment,
	onWaiveFee,
	onSwitchToVisits,
	onToggleStatus,
	isInactive,
}: FeeActionCardProps) {
	const [payInput, setPayInput] = useState(
		suggestedBalancePaise > 0 ? String(suggestedBalancePaise / 100) : "",
	);

	const handlePay = (e: React.FormEvent) => {
		e.preventDefault();
		const val = parseInt(payInput, 10);
		if (isNaN(val) || val <= 0) return;
		onCollectPayment(val * 100);
	};

	const handleVisits = () => {
		const visits = prompt(
			"Enter number of attended visits to charge (guest rate ₹400):",
			"2",
		);
		if (!visits) return;
		const count = parseInt(visits, 10) || 1;
		onSwitchToVisits(count);
	};

	const formattedBalance = (suggestedBalancePaise / 100).toLocaleString(
		"en-IN",
	);

	return (
		<div className="p-4 rounded-xl border border-border bg-background shadow-xs flex flex-col gap-3">
			<div className="flex items-start justify-between">
				<div>
					<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
						Current Outstanding Balance
					</span>
					<div className="mt-0.5 text-2xl font-extrabold mono-num text-foreground">
						₹{formattedBalance}
					</div>
				</div>
				<span
					className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
						suggestedBalancePaise > 0
							? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800"
							: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
					}`}
				>
					{suggestedBalancePaise > 0 ? "Dues Pending" : "Settled ✓"}
				</span>
			</div>

			<form onSubmit={handlePay} className="flex items-center gap-2 pt-1">
				<div className="relative flex-1">
					<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
						₹
					</span>
					<input
						type="number"
						value={payInput}
						onChange={(e) => setPayInput(e.target.value)}
						placeholder="Amount"
						className="w-full h-9 pl-6 pr-2.5 text-xs font-bold mono-num rounded-lg border border-input bg-background text-foreground"
					/>
				</div>
				<button
					type="submit"
					className="h-9 px-4 text-xs font-bold rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-xs"
				>
					Record Payment
				</button>
			</form>

			<div className="flex items-center gap-2 pt-2 border-t border-border flex-wrap text-xs">
				<button
					type="button"
					onClick={onWaiveFee}
					className="px-2.5 py-1 rounded-md border border-border text-foreground hover:bg-secondary font-medium"
				>
					No fee this month
				</button>
				<button
					type="button"
					onClick={handleVisits}
					className="px-2.5 py-1 rounded-md border border-border text-foreground hover:bg-secondary font-medium"
				>
					Charge visits instead
				</button>
				<button
					type="button"
					onClick={() => onToggleStatus(isInactive ? "active" : "inactive")}
					className={`px-2.5 py-1 rounded-md border font-medium ${
						isInactive
							? "border-emerald-300 text-emerald-700 dark:text-emerald-400"
							: "border-rose-300 text-rose-700 dark:text-rose-400"
					}`}
				>
					{isInactive ? "Set Active" : "Set Inactive"}
				</button>
			</div>
		</div>
	);
}
