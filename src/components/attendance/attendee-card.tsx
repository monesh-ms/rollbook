import { Check, X } from "lucide-react";
import type { Mark } from "../../lib/api/attendance";

export interface AttendeeProps {
	name: string;
	type: "member" | "student" | "guest";
	sports: string[];
	/** null means not marked yet. Neither button is selected. */
	status: Mark;
	/** Tapping the selected button clears the mark. */
	onMark: (next: "present" | "absent" | "clear") => void;
}

export function AttendeeCard({
	name,
	type,
	sports,
	status,
	onMark,
}: AttendeeProps) {
	const isGuest = type === "guest";

	return (
		<div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/70 last:border-b-0">
			<div className="flex flex-col min-w-0 gap-0.5">
				<span className="text-sm font-semibold tracking-tight text-foreground truncate">
					{name}
				</span>
				<div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
					<span className="capitalize">{type}</span>
					{sports.length > 0 && <span>• {sports.join(" & ")}</span>}
					{isGuest && (
						<span className="text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
							Per visit
						</span>
					)}
				</div>
			</div>

			<div className="touch-toggle">
				<button
					type="button"
					aria-pressed={status === "present"}
					onClick={() => onMark(status === "present" ? "clear" : "present")}
					className={`touch-btn ${status === "present" ? "is-active-present" : ""}`}
				>
					<Check className="w-3.5 h-3.5 stroke-[2.5]" />
					<span>Present</span>
				</button>
				<button
					type="button"
					aria-pressed={status === "absent"}
					onClick={() => onMark(status === "absent" ? "clear" : "absent")}
					className={`touch-btn ${status === "absent" ? "is-active-absent" : ""}`}
				>
					<X className="w-3.5 h-3.5 stroke-[2.5]" />
					<span>Absent</span>
				</button>
			</div>
		</div>
	);
}
