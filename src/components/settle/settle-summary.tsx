import { formatInr } from "../../lib/money";

interface SettleSummaryProps {
	monthLabel: string;
	totalOwed: number;
	carriedOver: number;
	unsettledCount: number;
	needsAmountCount: number;
}

export function SettleSummary({
	monthLabel,
	totalOwed,
	carriedOver,
	unsettledCount,
	needsAmountCount,
}: SettleSummaryProps) {
	return (
		<div className="p-4 rounded-xl border border-border bg-background">
			<span className="text-xs font-semibold text-muted-foreground">
				Still to collect · {monthLabel}
			</span>
			<div className="mt-1 text-3xl font-extrabold mono-num text-foreground">
				{formatInr(totalOwed)}
			</div>
			<p className="mt-2 text-sm text-muted-foreground">
				{unsettledCount} {unsettledCount === 1 ? "person" : "people"} still to
				pay
				{carriedOver > 0 && (
					<>
						{" · "}
						<span className="font-semibold text-rose-600 dark:text-rose-400">
							{formatInr(carriedOver)} from earlier months
						</span>
					</>
				)}
				{needsAmountCount > 0 &&
					` · ${needsAmountCount} need an amount typed in`}
			</p>
		</div>
	);
}
