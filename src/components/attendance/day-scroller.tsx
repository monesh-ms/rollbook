import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useMemo, useRef } from "react";

interface DayScrollerProps {
	selectedMonth?: string;
	dots?: Array<{ date: string; hasSessions: boolean; presentCount: number }>;
	tallySummary?: string;
}

export function DayScroller({
	selectedMonth = "2026-10",
	dots = [],
	tallySummary = "0 Marked",
}: DayScrollerProps) {
	const [selectedDate, setSelectedDate] = useQueryState(
		"date",
		parseAsString
			.withDefault(`${selectedMonth}-11`)
			.withOptions({ shallow: true }),
	);

	const scrollerRef = useRef<HTMLDivElement>(null);
	const selectedPillRef = useRef<HTMLButtonElement>(null);

	const days = useMemo(() => {
		const [yearStr, monthStr] = selectedMonth.split("-");
		const year = parseInt(yearStr || "2026", 10);
		const month = parseInt(monthStr || "10", 10);
		const daysInMonth = new Date(year, month, 0).getDate();
		const dotMap = new Map(dots.map((d) => [d.date, d]));

		const todayStr = "2026-10-11";

		const list = [];
		for (let day = 1; day <= daysInMonth; day++) {
			const dayNumStr = String(day).padStart(2, "0");
			const dateStr = `${year}-${String(month).padStart(2, "0")}-${dayNumStr}`;
			const dateObj = new Date(year, month - 1, day);
			const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
			const dot = dotMap.get(dateStr);

			list.push({
				date: dateStr,
				name: dayName,
				num: dayNumStr,
				hasSession: dot ? dot.hasSessions : false,
				isToday: dateStr === todayStr,
			});
		}
		return list;
	}, [selectedMonth, dots]);

	useEffect(() => {
		if (selectedDate && selectedPillRef.current && scrollerRef.current) {
			selectedPillRef.current.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
				inline: "center",
			});
		}
	}, [selectedDate]);

	return (
		<div className="px-4 py-2 bg-background border-b border-border">
			<div className="flex items-center justify-between mb-2">
				<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
					Select Day to Inspect / Edit
				</span>
				<span className="text-xs font-semibold text-muted-foreground">
					{tallySummary}
				</span>
			</div>

			<div ref={scrollerRef} className="day-scroller">
				{days.map((day) => {
					const isSelected = selectedDate === day.date;
					return (
						<button
							key={day.date}
							ref={isSelected ? selectedPillRef : null}
							type="button"
							onClick={() => setSelectedDate(day.date)}
							className={`day-pill ${isSelected ? "is-selected" : ""}`}
						>
							<span
								className={`text-[10px] font-bold uppercase ${
									isSelected ? "text-white/80" : "text-muted-foreground"
								}`}
							>
								{day.name}
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
