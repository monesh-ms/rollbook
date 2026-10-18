import type { LedgerLine } from "../../lib/api/members";
import { formatInr } from "../../lib/money";

interface LedgerTableProps {
	lines: LedgerLine[];
	busy: boolean;
	onReverse: (paymentId: string) => void;
}

const kindLabel: Record<LedgerLine["kind"], string> = {
	monthly_fee: "Fee",
	adjustment: "Correction",
	visit_charge: "Visit",
	payment: "Payment",
	reversal: "Reversal",
};

function formatDate(date: string): string {
	const [year, month, day] = date.split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
	});
}

export function LedgerTable({ lines, busy, onReverse }: LedgerTableProps) {
	if (lines.length === 0) {
		return (
			<p className="py-8 text-center text-xs text-muted-foreground">
				Nothing recorded yet.
			</p>
		);
	}

	return (
		<ul className="divide-y divide-border">
			{lines.map((line) => (
				<li
					key={line.id}
					className="flex items-center justify-between gap-3 py-3 text-xs"
				>
					<div className="flex flex-col gap-0.5 min-w-0">
						<span className="font-semibold text-foreground truncate">
							{line.description}
						</span>
						<span className="flex items-center gap-2 text-[11px] text-muted-foreground">
							<span>{formatDate(line.date)}</span>
							<span>· {kindLabel[line.kind]}</span>
							{line.reversible && (
								<button
									type="button"
									disabled={busy}
									onClick={() => {
										if (
											confirm(
												"Reverse this payment? The original stays in the log.",
											)
										) {
											onReverse(line.id);
										}
									}}
									className="text-rose-600 hover:text-rose-700 underline font-medium disabled:opacity-40"
								>
									Reverse
								</button>
							)}
						</span>
					</div>
					<span
						className={`text-sm font-bold mono-num flex-shrink-0 ${
							line.effect === "paid"
								? "text-emerald-700 dark:text-emerald-400"
								: line.effect === "owed"
									? "text-foreground"
									: "text-muted-foreground"
						}`}
					>
						{line.amount === null
							? "Not set"
							: `${line.effect === "paid" ? "−" : line.effect === "owed" ? "+" : ""}${formatInr(line.amount)}`}
					</span>
				</li>
			))}
		</ul>
	);
}
