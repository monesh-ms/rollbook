import { Check, X } from "lucide-react";

export interface AttendeeProps {
	id: string;
	memberId: string;
	name: string;
	type: "member" | "student" | "guest";
	sports: string[];
	status: "present" | "absent";
	onToggleStatus: (newStatus: "present" | "absent") => void;
}

export function AttendeeCard({
	name,
	type,
	sports,
	status,
	onToggleStatus,
}: AttendeeProps) {
	const initials = name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.substring(0, 2)
		.toUpperCase();

	const isGuest = type === "guest";
	const isStudent = type === "student";

	const avatarColor = sports.includes("Tennis")
		? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900"
		: "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900";

	return (
		<div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/70 last:border-b-0 hover:bg-secondary/40 transition-colors">
			<div className="flex items-center gap-3 min-w-0">
				<div
					className={`flex items-center justify-center w-9 h-9 text-xs font-bold rounded-lg border ${avatarColor} flex-shrink-0`}
				>
					{initials}
				</div>
				<div className="flex flex-col min-w-0 gap-0.5">
					<span className="text-sm font-semibold tracking-tight text-foreground truncate">
						{name}
					</span>
					<div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
						<span
							className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full border ${
								isGuest
									? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
									: isStudent
										? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
										: "bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800"
							}`}
						>
							{type}
						</span>
						<span>{sports.join(" & ")}</span>
						{isGuest && (
							<span className="text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
								(Per visit)
							</span>
						)}
					</div>
				</div>
			</div>

			<div className="touch-toggle">
				<button
					type="button"
					onClick={() => onToggleStatus("present")}
					className={`touch-btn ${status === "present" ? "is-active-present" : ""}`}
				>
					<Check className="w-3.5 h-3.5 stroke-[2.5]" />
					<span>Present</span>
				</button>
				<button
					type="button"
					onClick={() => onToggleStatus("absent")}
					className={`touch-btn ${status === "absent" ? "is-active-absent" : ""}`}
				>
					<X className="w-3.5 h-3.5 stroke-[2.5]" />
					<span>Absent</span>
				</button>
			</div>
		</div>
	);
}
