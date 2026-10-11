import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";

const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

interface MonthStepperProps {
	queryKey?: string;
	badgeText?: string;
	badgeColor?: string;
}

export function MonthStepper({
	queryKey = "month",
	badgeText,
	badgeColor = "text-teal-700",
}: MonthStepperProps) {
	const [monthParam, setMonthParam] = useQueryState(
		queryKey,
		parseAsString.withDefault("2026-10").withOptions({ shallow: true }),
	);

	const [yearStr, monthStr] = monthParam.split("-");
	const year = parseInt(yearStr || "2026", 10);
	const monthIdx = parseInt(monthStr || "10", 10) - 1;

	const step = (delta: number) => {
		let newMonthIdx = monthIdx + delta;
		let newYear = year;
		if (newMonthIdx < 0) {
			newMonthIdx = 11;
			newYear--;
		} else if (newMonthIdx > 11) {
			newMonthIdx = 0;
			newYear++;
		}
		const formatted = `${newYear}-${String(newMonthIdx + 1).padStart(2, "0")}`;
		setMonthParam(formatted);
	};

	const label = `${MONTH_NAMES[monthIdx]} ${year}`;

	return (
		<div className="flex items-center justify-between px-4 py-2 bg-background border-b border-border">
			<div className="flex items-center gap-1.5 p-1 bg-secondary border border-border rounded-full">
				<button
					type="button"
					onClick={() => step(-1)}
					className="flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
					title="Previous Month"
				>
					<ChevronLeft className="w-4 h-4" />
				</button>
				<span className="min-w-[100px] text-center text-xs font-bold tracking-tight text-foreground">
					{label}
				</span>
				<button
					type="button"
					onClick={() => step(1)}
					className="flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
					title="Next Month"
				>
					<ChevronRight className="w-4 h-4" />
				</button>
			</div>

			{badgeText && (
				<span className={`text-xs font-bold ${badgeColor}`}>{badgeText}</span>
			)}
		</div>
	);
}
