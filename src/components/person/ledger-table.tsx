interface LedgerItem {
	id: string;
	date: string;
	type: "monthly_fee" | "visit_charge" | "payment" | "reversal";
	description: string;
	amount: number;
	isCredit: boolean;
}

interface LedgerTableProps {
	items: LedgerItem[];
	onReversePayment?: (paymentId: string) => void;
}

export function LedgerTable({ items, onReversePayment }: LedgerTableProps) {
	if (items.length === 0) {
		return (
			<div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
				No ledger activity recorded yet.
			</div>
		);
	}

	const formatDate = (dateStr: string) => {
		try {
			const [y, m, d] = dateStr.split("-");
			if (!y || !m) return dateStr;
			const date = new Date(
				parseInt(y, 10),
				parseInt(m, 10) - 1,
				parseInt(d || "1", 10),
			);
			return date.toLocaleDateString("en-IN", {
				day: "numeric",
				month: "short",
				year: "numeric",
			});
		} catch {
			return dateStr;
		}
	};

	return (
		<div className="rounded-xl border border-border bg-background overflow-hidden shadow-xs">
			<div className="px-3.5 py-2.5 bg-secondary/50 border-b border-border flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
				<span>Activity / Item</span>
				<span>Amount</span>
			</div>

			<div className="divide-y divide-border">
				{items.map((item) => {
					const formattedAmount = (item.amount / 100).toLocaleString("en-IN");
					const isPayment = item.type === "payment";
					const isReversal = item.type === "reversal";

					return (
						<div
							key={item.id}
							className="p-3 flex items-center justify-between gap-3 text-xs"
						>
							<div className="flex flex-col gap-0.5 min-w-0">
								<div className="flex items-center gap-1.5 flex-wrap">
									<span className="font-semibold text-foreground truncate">
										{item.description}
									</span>
									<span
										className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm border uppercase tracking-wider ${
											isPayment
												? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
												: isReversal
													? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800"
													: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
										}`}
									>
										{item.type.replace("_", " ")}
									</span>
								</div>
								<div className="flex items-center gap-2 text-[11px] text-muted-foreground">
									<span>{formatDate(item.date)}</span>
									{isPayment && onReversePayment && (
										<button
											type="button"
											onClick={() => {
												if (
													confirm(
														`Reverse this payment of ₹${formattedAmount}?`,
													)
												) {
													onReversePayment(item.id);
												}
											}}
											className="text-rose-600 hover:text-rose-700 underline text-[10px] font-medium"
										>
											Reverse
										</button>
									)}
								</div>
							</div>

							<div
								className={`text-right font-extrabold mono-num text-sm flex-shrink-0 ${isCreditText(
									item.isCredit,
									isReversal,
								)}`}
							>
								{item.isCredit
									? `+₹${formattedAmount}`
									: `-₹${formattedAmount}`}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function isCreditText(isCredit: boolean, isReversal: boolean): string {
	if (isReversal) return "text-purple-600 dark:text-purple-400";
	if (isCredit) return "text-emerald-600 dark:text-emerald-400";
	return "text-foreground";
}
