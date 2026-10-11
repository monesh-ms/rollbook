import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState, useTransition } from "react";
import { MobileHeader } from "../../components/layout/mobile-header";
import { MemberCard } from "../../components/people/member-card";
import { RegisterModal } from "../../components/people/register-modal";
import { FilterChips } from "../../components/ui/filter-chips";
import { SearchBar } from "../../components/ui/search-bar";
import { getMembers, registerMember } from "../../lib/api/members";

export const Route = createFileRoute("/people/")({
	validateSearch: (
		search: Record<string, unknown>,
	): {
		status?: string;
		type?: string;
		q?: string;
	} => ({
		status: (search.status as string) || "all",
		type: (search.type as string) || "all",
		q: (search.q as string) || "",
	}),
	loader: async () => {
		const data = await getMembers({ data: {} });
		return { data };
	},
	component: PeoplePage,
});

function PeoplePage() {
	const { data } = Route.useLoaderData();
	const router = useRouter();
	const [, startTransition] = useTransition();

	const [typeFilter] = useQueryState("type", parseAsString.withDefault("all"));
	const [statusFilter] = useQueryState(
		"status",
		parseAsString.withDefault("all"),
	);
	const [searchQuery] = useQueryState("q", parseAsString.withDefault(""));

	const [isRegisterOpen, setIsRegisterOpen] = useState(false);

	const handleRegister = async (
		form: Parameters<typeof registerMember>[0]["data"],
	) => {
		try {
			await registerMember({ data: form });
			startTransition(() => {
				router.invalidate();
			});
		} catch (err) {
			console.error("Failed to register member:", err);
			alert("Failed to register member");
		}
	};

	const filteredMembers = data.members.filter((m: any) => {
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			const matchesName = m.name.toLowerCase().includes(q);
			const matchesPhone = m.contactNumber
				? m.contactNumber.includes(q)
				: false;
			if (!matchesName && !matchesPhone) return false;
		}
		if (typeFilter !== "all" && m.type !== typeFilter) {
			return false;
		}
		if (statusFilter !== "all" && m.status !== statusFilter) {
			return false;
		}
		return true;
	});

	// Available sports for registration dropdown
	const availableGames = [
		{ id: "game_badminton", name: "Badminton" },
		{ id: "game_tennis", name: "Tennis" },
	];

	return (
		<div className="flex flex-col flex-1">
			<MobileHeader
				title="Directory"
				subtitle={`${data.summary.totalActive} Active Players`}
				action={
					<button
						type="button"
						onClick={() => setIsRegisterOpen(true)}
						className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-xs"
					>
						<Plus className="w-4 h-4" />
						<span>Add</span>
					</button>
				}
			/>

			<div className="p-4 bg-background border-b border-border space-y-2.5">
				<SearchBar placeholder="Search by player name or mobile..." />

				<div className="flex items-center gap-2 overflow-x-auto pb-0.5">
					<FilterChips
						paramName="type"
						options={[
							{ label: "All Players", value: "all" },
							{ label: "Students", value: "student" },
							{ label: "Members", value: "member" },
							{ label: "Guests", value: "guest" },
						]}
					/>
					<span className="text-border">|</span>
					<FilterChips
						paramName="status"
						options={[
							{ label: "Active", value: "active" },
							{ label: "All Status", value: "all" },
							{ label: "Inactive", value: "inactive" },
						]}
					/>
				</div>
			</div>

			<div className="p-4">
				<div className="rounded-xl border border-border bg-background overflow-hidden shadow-xs">
					<div className="px-4 py-2.5 bg-secondary/50 border-b border-border flex items-center justify-between">
						<span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
							Roster
						</span>
						<span className="text-[11px] font-bold text-muted-foreground">
							{filteredMembers.length} Members
						</span>
					</div>

					<div className="divide-y divide-border">
						{filteredMembers.map((member: any) => (
							<MemberCard key={member.id} member={member} />
						))}

						{filteredMembers.length === 0 && (
							<div className="p-8 text-center text-xs text-muted-foreground">
								No members found matching filter.
							</div>
						)}
					</div>
				</div>
			</div>

			<RegisterModal
				isOpen={isRegisterOpen}
				onClose={() => setIsRegisterOpen(false)}
				onRegister={handleRegister}
				availableGames={availableGames}
			/>
		</div>
	);
}
