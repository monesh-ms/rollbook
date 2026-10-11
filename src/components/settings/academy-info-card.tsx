interface AcademyInfoCardProps {
	academy: {
		id: string;
		name: string;
		timezone: string;
		currency: string;
	};
}

export function AcademyInfoCard({ academy }: AcademyInfoCardProps) {
	return (
		<div className="p-4 rounded-xl border border-border bg-background shadow-xs flex flex-col gap-3">
			<div>
				<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
					Academy Profile
				</span>
				<h3 className="text-base font-extrabold text-foreground mt-0.5">
					{academy.name}
				</h3>
			</div>

			<div className="grid grid-cols-2 gap-3 pt-1 border-t border-border text-xs">
				<div>
					<span className="text-[10px] font-medium text-muted-foreground block">
						Timezone
					</span>
					<span className="font-semibold text-foreground">
						{academy.timezone}
					</span>
				</div>
				<div>
					<span className="text-[10px] font-medium text-muted-foreground block">
						Billing Currency
					</span>
					<span className="font-semibold text-foreground">
						{academy.currency} (₹)
					</span>
				</div>
			</div>

			<div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
				<span>RollBook v1.0 • Mobile First</span>
				<span className="flex items-center gap-1.5 font-medium text-teal-700 dark:text-teal-400">
					<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
					Active
				</span>
			</div>
		</div>
	);
}
