interface SettleSummaryProps {
	monthName: string;
	totalDuePaise: number;
	priorArrearsPaise: number;
}

export function SettleSummary({
	monthName,
	totalDuePaise,
	priorArrearsPaise,
}: SettleSummaryProps) {
	const formattedTotal = (totalDuePaise / 100).toLocaleString("en-IN");
	const formattedArrears = (priorArrearsPaise / 100).toLocaleString("en-IN");

	return (
		<div className="p-4 rounded-xl border border-border bg-gradient-to-b from-background to-secondary/30 shadow-xs">
			<div className="flex items-start justify-between">
				<div>
					<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
						Total Outstanding · {monthName}
					</span>
					<div className="mt-0.5 text-2xl font-extrabold mono-num text-rose-600 dark:text-rose-400">
						₹{formattedTotal}
					</div>
				</div>
				<div className="text-right">
					<span className="text-[11px] font-medium text-muted-foreground">
						Prior Arrears
					</span>
					<div className="text-sm font-bold mono-num text-amber-600 dark:text-amber-400">
						₹{formattedArrears}
					</div>
				</div>
			</div>
		</div>
	);
}
