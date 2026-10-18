import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { PersonListItem } from "../../lib/api/members";
import { formatInr } from "../../lib/money";

interface MemberCardProps {
	member: PersonListItem;
}

export function MemberCard({ member }: MemberCardProps) {
	const isInactive = member.status === "inactive";

	return (
		<Link
			to="/people/$id"
			params={{ id: member.id }}
			className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/70 last:border-b-0 hover:bg-secondary/40"
		>
			<div className="flex flex-col min-w-0 gap-0.5">
				<span className="text-sm font-semibold tracking-tight text-foreground truncate">
					{member.name}
				</span>
				<div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
					<span className="capitalize">{member.type}</span>
					{member.sports.length > 0 && (
						<span>• {member.sports.join(", ")}</span>
					)}
					<span>• {member.batch} batch</span>
					{isInactive && (
						<span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
							Inactive
						</span>
					)}
				</div>
			</div>

			<div className="flex items-center gap-2 text-xs flex-shrink-0">
				{member.owed > 0 && (
					<span className="font-bold mono-num text-rose-600 dark:text-rose-400">
						{formatInr(member.owed)}
					</span>
				)}
				<ChevronRight className="w-4 h-4 text-muted-foreground" />
			</div>
		</Link>
	);
}
