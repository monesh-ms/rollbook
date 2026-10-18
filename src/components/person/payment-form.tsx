import { useState } from "react";
import { rupeesToPaise } from "../../lib/money";

export interface PaymentInput {
	amount: number;
	paymentMethod: "cash" | "upi" | "other";
}

interface PaymentFormProps {
	/** Suggested amount, in paise. Shown as the default. */
	suggested: number;
	busy: boolean;
	onSubmit: (input: PaymentInput) => void;
}

export function PaymentForm({ suggested, busy, onSubmit }: PaymentFormProps) {
	const [amount, setAmount] = useState(
		suggested > 0 ? String(suggested / 100) : "",
	);
	const [method, setMethod] = useState<PaymentInput["paymentMethod"]>("cash");
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const paise = rupeesToPaise(amount);
		if (paise === null || paise <= 0) {
			setError("Enter the amount received, more than zero.");
			return;
		}
		setError(null);
		onSubmit({ amount: paise, paymentMethod: method });
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-2">
			<div className="flex items-end gap-2">
				<label className="flex-1 text-xs font-semibold text-muted-foreground">
					Amount received (₹)
					<input
						name="payment-amount"
						type="text"
						inputMode="numeric"
						autoComplete="off"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						className="mt-1 w-full h-9 px-2.5 text-xs font-bold mono-num rounded-lg border border-input bg-background text-foreground"
					/>
				</label>
				<label className="text-xs font-semibold text-muted-foreground">
					Paid by
					<select
						name="payment-method"
						value={method}
						onChange={(e) =>
							setMethod(e.target.value as PaymentInput["paymentMethod"])
						}
						className="mt-1 block h-9 px-2 text-xs rounded-lg border border-input bg-background text-foreground"
					>
						<option value="cash">Cash</option>
						<option value="upi">UPI</option>
						<option value="other">Other</option>
					</select>
				</label>
				<button
					type="submit"
					disabled={busy}
					className="h-9 px-3 text-xs font-bold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40"
				>
					Record payment
				</button>
			</div>
			{error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
		</form>
	);
}
