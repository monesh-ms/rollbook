import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export interface MemberListItem {
	id: string;
	name: string;
	type: "member" | "student" | "guest";
	batch: "morning" | "evening" | "both";
	sports: Array<{ id: string; name: string }>;
	contactNumber: string | null;
	address: string | null;
	status: "active" | "inactive";
}

interface MemberCardProps {
	member: MemberListItem;
}

export function MemberCard({ member }: MemberCardProps) {
	const isInactive = member.status === "inactive";
	const initials = member.name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.substring(0, 2)
		.toUpperCase();

	const sportsLabel = member.sports.map((s) => s.name).join(", ");

	return (
		<Link
			to="/people/$id"
			params={{ id: member.id }}
			className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/70 last:border-b-0 hover:bg-secondary/40 transition-colors"
		>
			<div className="flex items-center gap-3 min-w-0">
				<div className="flex items-center justify-center w-9 h-9 text-xs font-bold rounded-lg border bg-secondary text-foreground flex-shrink-0">
					{initials}
				</div>
				<div className="flex flex-col min-w-0 gap-0.5">
					<span className="text-sm font-semibold tracking-tight text-foreground truncate">
						{member.name}
					</span>
					<div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
						<span
							className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full border ${
								isInactive
									? "bg-muted text-muted-foreground border-border"
									: "bg-secondary text-foreground border-border"
							}`}
						>
							{member.type}
						</span>
						<span>{sportsLabel}</span>
						<span>•</span>
						<span className="capitalize">{member.batch}</span>
						{isInactive && (
							<span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
								(Inactive)
							</span>
						)}
					</div>
				</div>
			</div>

			<div className="flex items-center gap-1 text-xs font-medium text-muted-foreground flex-shrink-0">
				<span>Ledger</span>
				<ChevronRight className="w-4 h-4" />
			</div>
		</Link>
	);
}
