import { useState } from "react";
import { rupeesToPaise } from "../../lib/money";

export type MonthAction = "set_amount" | "waive_no_fee" | "switch_to_visits";

export interface MonthActionInput {
	month: string;
	action: MonthAction;
	amount?: number;
}

interface MonthActionsProps {
	currentMonth: string;
	busy: boolean;
	onSubmit: (input: MonthActionInput) => void;
}

/** Corrections for one month. Each one is logged; the earlier amount stays visible. */
export function MonthActions({
	currentMonth,
	busy,
	onSubmit,
}: MonthActionsProps) {
	const [month, setMonth] = useState(currentMonth);
	const [amount, setAmount] = useState("");
	const [error, setError] = useState<string | null>(null);

	const submit = (action: MonthAction) => {
		if (!month) {
			setError("Pick the month first.");
			return;
		}
		if (action === "set_amount") {
			const paise = rupeesToPaise(amount);
			if (paise === null || paise < 0) {
				setError("Enter this month's amount in rupees.");
				return;
			}
			setError(null);
			onSubmit({ month, action, amount: paise });
			return;
		}
		setError(null);
		onSubmit({ month, action });
	};

	return (
		<div className="flex flex-col gap-3">
			<label className="text-xs font-semibold text-muted-foreground">
				Month
				<input
					name="fee-month"
					type="month"
					value={month}
					max={currentMonth}
					onChange={(e) => setMonth(e.target.value)}
					className="mt-1 block h-9 px-2.5 text-xs rounded-lg border border-input bg-background text-foreground"
				/>
			</label>

			<div className="flex items-end gap-2">
				<label className="flex-1 text-xs font-semibold text-muted-foreground">
					Set this month's amount (₹)
					<input
						name="month-amount"
						type="text"
						inputMode="numeric"
						autoComplete="off"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						className="mt-1 w-full h-9 px-2.5 text-xs font-bold mono-num rounded-lg border border-input bg-background text-foreground"
					/>
				</label>
				<button
					type="button"
					disabled={busy}
					onClick={() => submit("set_amount")}
					className="h-9 px-3 text-xs font-bold rounded-lg border border-border text-foreground hover:bg-secondary disabled:opacity-40"
				>
					Set amount
				</button>
			</div>

			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					disabled={busy}
					onClick={() => submit("waive_no_fee")}
					className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-secondary disabled:opacity-40"
				>
					No fee this month
				</button>
				<button
					type="button"
					disabled={busy}
					onClick={() => submit("switch_to_visits")}
					className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-secondary disabled:opacity-40"
				>
					Charge visits instead
				</button>
			</div>

			{error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
		</div>
	);
}
