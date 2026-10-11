import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import type { SettleAccount } from "../../lib/api/settle";

interface SettleCardProps {
	account: SettleAccount;
	onQuickCollect: (memberId: string, amountPaise: number) => void;
}

export function SettleCard({ account, onQuickCollect }: SettleCardProps) {
	const hasArrears = account.priorArrears > 0;
	const formattedSuggested = (account.totalSuggested / 100).toLocaleString(
		"en-IN",
	);
	const formattedPrior = (account.priorArrears / 100).toLocaleString("en-IN");
	const formattedCurrent = (account.currentMonthFee / 100).toLocaleString(
		"en-IN",
	);

	const initials = account.name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.substring(0, 2)
		.toUpperCase();

	return (
		<div
			className={`p-4 border-b border-border/70 last:border-b-0 flex flex-col gap-3 transition-colors ${
				hasArrears
					? "bg-rose-50/40 dark:bg-rose-950/20 border-l-2 border-l-rose-500"
					: ""
			}`}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-3 min-w-0">
					<div className="flex items-center justify-center w-9 h-9 text-xs font-bold rounded-lg border bg-secondary text-foreground flex-shrink-0">
						{initials}
					</div>
					<div className="flex flex-col min-w-0">
						<Link
							to="/people/$id"
							params={{ id: account.memberId }}
							className="text-sm font-bold tracking-tight text-foreground hover:underline truncate"
						>
							{account.name}
						</Link>
						<div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground mt-0.5">
							<span className="capitalize">{account.type}</span>
							<span>•</span>
							<span>{account.sports.join(", ")}</span>
							{hasArrears && (
								<span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
									Carryover
								</span>
							)}
						</div>
					</div>
				</div>

				<div className="text-right flex-shrink-0">
					<div className="text-base font-extrabold mono-num text-foreground">
						₹{formattedSuggested}
					</div>
					<span className="text-[11px] font-medium text-muted-foreground">
						Suggested
					</span>
				</div>
			</div>

			{hasArrears && (
				<div className="text-xs p-2 rounded-md bg-background/60 border border-border text-muted-foreground leading-relaxed">
					<span className="text-rose-600 dark:text-rose-400 font-semibold">
						Unpaid Arrears: ₹{formattedPrior}
					</span>{" "}
					+ Current Fee: ₹{formattedCurrent}
					{!account.hasAttendanceThisMonth && (
						<div className="text-[11px] text-muted-foreground mt-0.5">
							Notice: No attendance marked this month.
						</div>
					)}
				</div>
			)}

			<div className="flex items-center justify-between pt-1 border-t border-dashed border-border/70 text-xs">
				<Link
					to="/people/$id"
					params={{ id: account.memberId }}
					className="font-semibold text-teal-700 dark:text-teal-400 hover:underline"
				>
					Adjust / Details →
				</Link>
				<button
					type="button"
					onClick={() =>
						onQuickCollect(account.memberId, account.totalSuggested)
					}
					className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-xs"
				>
					<Check className="w-3.5 h-3.5 stroke-[2.5]" />
					<span>Collect ₹{formattedSuggested}</span>
				</button>
			</div>
		</div>
	);
}
