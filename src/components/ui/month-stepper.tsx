import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths } from "../../lib/time";

interface MonthStepperProps {
	/** 'YYYY-MM' */
	month: string;
	onChange: (month: string) => void;
}

export function MonthStepper({ month, onChange }: MonthStepperProps) {
	const [year, monthNumber] = month.split("-").map(Number);
	const label = new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString(
		"en-IN",
		{ month: "long", year: "numeric", timeZone: "UTC" },
	);

	return (
		<div className="flex items-center justify-between px-4 py-2 bg-background border-b border-border">
			<div className="flex items-center gap-1.5 p-1 bg-secondary border border-border rounded-full">
				<button
					type="button"
					onClick={() => onChange(addMonths(month, -1))}
					className="flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
					aria-label="Previous month"
				>
					<ChevronLeft className="w-4 h-4" />
				</button>
				<span className="min-w-[120px] text-center text-xs font-bold tracking-tight text-foreground">
					{label}
				</span>
				<button
					type="button"
					onClick={() => onChange(addMonths(month, 1))}
					className="flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
					aria-label="Next month"
				>
					<ChevronRight className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}
