import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState } from "react";
import type { SettleAccount } from "../../lib/api/settle";
import { formatInr, rupeesToPaise } from "../../lib/money";

export interface PaymentDraft {
	memberId: string;
	amount: number;
	paymentMethod: "cash" | "upi" | "other";
}

const methods: Array<{ value: PaymentDraft["paymentMethod"]; label: string }> =
	[
		{ value: "cash", label: "Cash" },
		{ value: "upi", label: "UPI" },
		{ value: "other", label: "Other" },
	];

interface SettleModalProps {
	account: SettleAccount;
	monthLabel: string;
	busy: boolean;
	error: string | null;
	onClose: () => void;
	onPay: (draft: PaymentDraft) => void;
	onSetAmount: (memberId: string, amount: number) => void;
}

/**
 * Receives a payment, or types this month's amount when it is missing.
 * Mount it only while open, so its fields start from `account`.
 */
export function SettleModal({
	account,
	monthLabel,
	busy,
	error,
	onClose,
	onPay,
	onSetAmount,
}: SettleModalProps) {
	const [payInput, setPayInput] = useState(
		account.totalOwed > 0 ? String(account.totalOwed / 100) : "",
	);
	const [method, setMethod] = useState<PaymentDraft["paymentMethod"]>("cash");
	const [amountInput, setAmountInput] = useState("");
	const [formError, setFormError] = useState<string | null>(null);

	const submitPayment = (e: React.FormEvent) => {
		e.preventDefault();
		const paise = rupeesToPaise(payInput);
		if (paise === null || paise <= 0) {
			setFormError("Enter the amount received, more than zero.");
			return;
		}
		setFormError(null);
		onPay({ memberId: account.memberId, amount: paise, paymentMethod: method });
	};

	const submitAmount = (e: React.FormEvent) => {
		e.preventDefault();
		const paise = rupeesToPaise(amountInput);
		if (paise === null || paise < 0) {
			setFormError("Enter this month's amount in rupees.");
			return;
		}
		setFormError(null);
		onSetAmount(account.memberId, paise);
	};

	const field =
		"w-full h-11 px-3 mt-1 text-base font-bold mono-num rounded-lg border border-input bg-background text-foreground";

	const footer = (submitLabel: string) => (
		<div className="flex gap-2 pt-1">
			<button
				type="button"
				onClick={onClose}
				className="flex-1 h-11 text-sm font-bold rounded-lg border border-border text-foreground hover:bg-secondary"
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={busy}
				className="flex-1 h-11 text-sm font-bold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40"
			>
				{busy ? "Saving…" : submitLabel}
			</button>
		</div>
	);

	return (
		<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
			<div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto p-4 rounded-xl border border-border bg-background">
				<div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
					<div className="min-w-0">
						<div className="text-base font-bold text-foreground truncate">
							{account.name}
						</div>
						<div className="text-xs text-muted-foreground">{monthLabel}</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1 text-muted-foreground hover:text-foreground"
						aria-label="Close"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="pt-3 flex flex-col gap-3">
					<div>
						<span className="text-xs font-semibold text-muted-foreground">
							Owed now
						</span>
						<div className="text-3xl font-extrabold mono-num text-foreground">
							{account.needsAmount
								? "Not set"
								: formatInr(Math.max(0, account.totalOwed))}
						</div>
					</div>

					<dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
						<dt className="text-muted-foreground">From earlier months</dt>
						<dd className="text-right mono-num">
							{formatInr(account.carriedOver)}
						</dd>
						<dt className="text-muted-foreground">
							This month{account.isCustomRate ? " (typed amount)" : ""}
						</dt>
						<dd className="text-right mono-num">
							{account.feeThisMonth === null
								? "Not set"
								: formatInr(account.feeThisMonth)}
						</dd>
						{account.visitsThisMonth > 0 && (
							<>
								<dt className="text-muted-foreground">Visits this month</dt>
								<dd className="text-right mono-num">
									{formatInr(account.visitsThisMonth)}
								</dd>
							</>
						)}
						{account.paidThisMonth !== 0 && (
							<>
								<dt className="text-muted-foreground">Paid this month</dt>
								<dd className="text-right mono-num">
									−{formatInr(account.paidThisMonth)}
								</dd>
							</>
						)}
					</dl>

					{!account.hasAttendanceThisMonth && (
						<p className="text-xs text-muted-foreground">
							No attendance marked this month. The fee is not changed by this.
						</p>
					)}

					{account.needsAmount ? (
						<form onSubmit={submitAmount} className="flex flex-col gap-3">
							<label className="block text-sm font-semibold text-muted-foreground">
								This month's amount (₹)
								<input
									name="month-amount"
									type="text"
									inputMode="numeric"
									autoComplete="off"
									value={amountInput}
									onChange={(e) => setAmountInput(e.target.value)}
									className={field}
								/>
							</label>
							{footer("Save amount")}
						</form>
					) : (
						<form onSubmit={submitPayment} className="flex flex-col gap-3">
							<label className="block text-sm font-semibold text-muted-foreground">
								Amount received (₹)
								<input
									name="amount-received"
									type="text"
									inputMode="numeric"
									autoComplete="off"
									value={payInput}
									onChange={(e) => setPayInput(e.target.value)}
									className={field}
								/>
							</label>
							<fieldset>
								<legend className="text-sm font-semibold text-muted-foreground">
									How was it paid?
								</legend>
								<div className="mt-1 grid grid-cols-3 gap-2">
									{methods.map((option) => (
										<button
											key={option.value}
											type="button"
											aria-pressed={method === option.value}
											onClick={() => setMethod(option.value)}
											className={`h-11 text-sm font-bold rounded-lg border transition-colors ${
												method === option.value
													? "bg-teal-700 border-teal-700 text-white"
													: "bg-background border-input text-foreground hover:bg-secondary"
											}`}
										>
											{option.label}
										</button>
									))}
								</div>
							</fieldset>
							{footer("Save payment")}
						</form>
					)}

					{(formError || error) && (
						<p role="alert" className="text-sm font-semibold text-rose-600">
							{formError ?? error}
						</p>
					)}

					<Link
						to="/people/$id"
						params={{ id: account.memberId }}
						className="text-sm font-semibold text-teal-700 dark:text-teal-400 hover:underline"
					>
						Open full ledger →
					</Link>
				</div>
			</div>
		</div>
	);
}
