import type { SettleAccount } from "../../lib/api/settle";
import { formatInr } from "../../lib/money";

interface SettleRowProps {
	account: SettleAccount;
	onOpen: () => void;
}

/** One person per row: who, what they owe, and one button. The breakdown is in the popup. */
export function SettleRow({ account, onOpen }: SettleRowProps) {
	const carried = account.carriedOver > 0;
	const notMarked = !account.hasAttendanceThisMonth;

	return (
		<div
			className={`px-4 py-3 border-b border-border/70 last:border-b-0 flex flex-col gap-2 ${
				carried ? "border-l-2 border-l-rose-500" : ""
			}`}
		>
			<div className="flex items-baseline justify-between gap-3">
				<span className="text-base font-bold tracking-tight text-foreground truncate">
					{account.name}
				</span>
				<span className="flex-shrink-0 text-base font-extrabold mono-num text-foreground">
					{account.needsAmount ? (
						"Not set"
					) : (
						<>
							{formatInr(Math.max(0, account.totalOwed))}
							<span className="ml-1 text-xs font-medium text-muted-foreground">
								owed
							</span>
						</>
					)}
				</span>
			</div>

			<div className="flex items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-x-1.5 min-w-0 text-xs text-muted-foreground">
					<span className="capitalize">{account.type}</span>
					{account.sports.length > 0 && (
						<span>• {account.sports.join(" & ")}</span>
					)}
					{account.status === "inactive" && (
						<span className="font-bold text-rose-600 dark:text-rose-400">
							Inactive
						</span>
					)}
				</div>
				<button
					type="button"
					onClick={onOpen}
					className="flex-shrink-0 h-10 px-4 text-sm font-bold rounded-lg bg-teal-700 text-white hover:bg-teal-800"
				>
					{account.needsAmount ? "Enter amount" : "Receive payment"}
				</button>
			</div>

			{(carried || notMarked) && (
				<p className="text-xs text-muted-foreground">
					{carried && (
						<span className="font-semibold text-rose-600 dark:text-rose-400">
							{formatInr(account.carriedOver)} from earlier months
						</span>
					)}
					{carried && notMarked && " · "}
					{notMarked && "No attendance marked this month"}
				</p>
			)}
		</div>
	);
}
