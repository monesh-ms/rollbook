import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { MobileHeader } from "../../components/layout/mobile-header";
import { MemberCard } from "../../components/people/member-card";
import {
	type PersonForm,
	PersonModal,
} from "../../components/people/register-modal";
import { FilterChips } from "../../components/ui/filter-chips";
import { Notice } from "../../components/ui/notice";
import { SearchBar } from "../../components/ui/search-bar";
import { getMembers, registerMember } from "../../lib/api/members";
import { getSettings } from "../../lib/api/settings";
import { errorText } from "../../lib/money";

export const Route = createFileRoute("/people/")({
	loader: async () => {
		const [people, settings] = await Promise.all([getMembers(), getSettings()]);
		return { people, games: settings.games };
	},
	component: PeoplePage,
});

function PeoplePage() {
	const { people, games } = Route.useLoaderData();
	const router = useRouter();

	const [typeFilter] = useQueryState("type", parseAsString.withDefault("all"));
	const [statusFilter] = useQueryState(
		"status",
		parseAsString.withDefault("all"),
	);
	const [searchQuery] = useQueryState("q", parseAsString.withDefault(""));

	const [adding, setAdding] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleRegister = async (form: PersonForm) => {
		setError(null);
		setBusy(true);
		try {
			await registerMember({ data: form });
			setAdding(false);
			await router.invalidate();
		} catch (err) {
			setError(errorText(err));
		} finally {
			setBusy(false);
		}
	};

	const query = searchQuery.trim().toLowerCase();
	const filtered = people.members.filter((person) => {
		if (query) {
			const matchesName = person.name.toLowerCase().includes(query);
			const matchesPhone = person.contactNumber?.includes(query) ?? false;
			if (!matchesName && !matchesPhone) return false;
		}
		if (typeFilter !== "all" && person.type !== typeFilter) return false;
		if (statusFilter !== "all" && person.status !== statusFilter) return false;
		return true;
	});

	return (
		<div className="flex flex-col flex-1">
			<MobileHeader
				title="People"
				subtitle={`${people.summary.totalActive} active`}
				action={
					<button
						type="button"
						onClick={() => setAdding(true)}
						className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold bg-teal-700 text-white hover:bg-teal-800"
					>
						<Plus className="w-4 h-4" />
						<span>Add person</span>
					</button>
				}
			/>

			<div className="p-4 bg-background border-b border-border space-y-2.5">
				<SearchBar placeholder="Search by name or phone…" />
				<div className="flex items-center gap-2 overflow-x-auto pb-0.5">
					<FilterChips
						paramName="type"
						options={[
							{ label: "All types", value: "all" },
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
							{ label: "Inactive", value: "inactive" },
							{ label: "All", value: "all" },
						]}
					/>
				</div>
			</div>

			<div className="p-4 space-y-3">
				{error && !adding && <Notice>{error}</Notice>}
				<div className="rounded-xl border border-border bg-background overflow-hidden">
					{filtered.map((person) => (
						<MemberCard key={person.id} member={person} />
					))}
					{filtered.length === 0 && (
						<div className="p-8 text-center text-xs text-muted-foreground">
							No one matches this view.
						</div>
					)}
				</div>
			</div>

			{adding && (
				<PersonModal
					title="Add person"
					submitLabel="Save person"
					games={games.map((game) => ({ id: game.id, name: game.name }))}
					busy={busy}
					error={error}
					onClose={() => {
						setError(null);
						setAdding(false);
					}}
					onSubmit={(form) => void handleRegister(form)}
				/>
			)}
		</div>
	);
}
