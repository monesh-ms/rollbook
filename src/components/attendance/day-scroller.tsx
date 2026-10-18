import { useEffect, useMemo, useRef } from "react";
import { monthOf } from "../../lib/time";

interface DayScrollerProps {
	/** 'YYYY-MM-DD' */
	selectedDate: string;
	/** Academy's today, from the server. */
	today: string;
	dots: Array<{ date: string; markedCount: number; presentCount: number }>;
	tallySummary: string;
	onSelect: (date: string) => void;
}

export function DayScroller({
	selectedDate,
	today,
	dots,
	tallySummary,
	onSelect,
}: DayScrollerProps) {
	const selectedPillRef = useRef<HTMLButtonElement>(null);

	const days = useMemo(() => {
		const month = monthOf(selectedDate);
		const [year, monthNumber] = month.split("-").map(Number);
		const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
		const marked = new Set(
			dots.filter((d) => d.markedCount > 0).map((d) => d.date),
		);

		return Array.from({ length: daysInMonth }, (_, index) => {
			const day = index + 1;
			const date = `${month}-${String(day).padStart(2, "0")}`;
			const weekday = new Date(
				Date.UTC(year, monthNumber - 1, day),
			).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
			return {
				date,
				weekday,
				num: String(day).padStart(2, "0"),
				hasSession: marked.has(date),
				isToday: date === today,
			};
		});
	}, [selectedDate, today, dots]);

	// Keeps the selected day in view when it changes. selectedDate is the trigger.
	// biome-ignore lint/correctness/useExhaustiveDependencies: selectedDate is the trigger
	useEffect(() => {
		selectedPillRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
			inline: "center",
		});
	}, [selectedDate]);

	return (
		<div className="px-4 py-2 bg-background border-b border-border">
			<div className="flex items-center justify-between mb-2">
				<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
					Select day
				</span>
				<span className="text-xs font-semibold text-muted-foreground">
					{tallySummary}
				</span>
			</div>

			<div className="day-scroller">
				{days.map((day) => {
					const isSelected = selectedDate === day.date;
					return (
						<button
							key={day.date}
							ref={isSelected ? selectedPillRef : null}
							type="button"
							onClick={() => onSelect(day.date)}
							aria-pressed={isSelected}
							aria-label={`${day.weekday} ${day.num}${day.isToday ? ", today" : ""}`}
							className={`day-pill ${isSelected ? "is-selected" : ""}`}
						>
							<span
								className={`text-[10px] font-bold uppercase ${
									isSelected ? "text-white/80" : "text-muted-foreground"
								}`}
							>
								{day.weekday}
							</span>
							<span
								className={`text-base font-extrabold mono-num ${
									isSelected ? "text-white" : "text-foreground"
								}`}
							>
								{day.num}
							</span>
							<span
								className={`w-1 h-1 rounded-full ${
									isSelected
										? "bg-white"
										: day.hasSession
											? "bg-emerald-600"
											: "bg-muted-foreground/30"
								}`}
							/>
						</button>
					);
				})}
			</div>
		</div>
	);
}
