import {
	createFileRoute,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { AddGuestModal } from "../components/attendance/add-guest-modal";
import { AttendeeCard } from "../components/attendance/attendee-card";
import { DayScroller } from "../components/attendance/day-scroller";
import { MobileHeader } from "../components/layout/mobile-header";
import { FilterChips } from "../components/ui/filter-chips";
import { MonthStepper } from "../components/ui/month-stepper";
import { Notice } from "../components/ui/notice";
import { SearchBar } from "../components/ui/search-bar";
import {
	addGuestToSession,
	getAttendanceDay,
	type Mark,
	markAttendance,
	type RosterEntry,
} from "../lib/api/attendance";
import { errorText } from "../lib/money";
import { dateInMonth, monthOf } from "../lib/time";

export const Route = createFileRoute("/attendance")({
	validateSearch: (search: Record<string, unknown>): { date?: string } => ({
		date: typeof search.date === "string" ? search.date : undefined,
	}),
	loaderDeps: ({ search }) => ({ date: search.date }),
	loader: ({ deps }) =>
		getAttendanceDay({ data: deps.date ? { date: deps.date } : {} }),
	component: AttendancePage,
});

type Batch = "morning" | "evening";
type Pending = Record<string, { status: Mark }>;

const batchLabel: Record<Batch, string> = {
	morning: "Morning batch",
	evening: "Evening batch",
};

function AttendancePage() {
	const data = Route.useLoaderData();
	const router = useRouter();
	const navigate = useNavigate({ from: "/attendance" });

	const [batchFilter] = useQueryState(
		"batch",
		parseAsString.withDefault("all"),
	);
	const [sportFilter] = useQueryState(
		"sport",
		parseAsString.withDefault("all"),
	);
	const [searchQuery] = useQueryState("q", parseAsString.withDefault(""));

	// Marks shown before the server confirms them. Keyed by date so one day never shows another day's mark.
	const [pending, setPending] = useState<Pending>({});
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [guestBatch, setGuestBatch] = useState<Batch | null>(null);

	const pendingKey = (memberId: string, batch: Batch) =>
		`${data.date}|${memberId}|${batch}`;

	const statusOf = (entry: RosterEntry, batch: Batch): Mark => {
		const key = pendingKey(entry.memberId, batch);
		return key in pending ? pending[key].status : entry.status;
	};

	const reload = async (key?: string) => {
		try {
			await router.invalidate();
		} finally {
			if (key) {
				setPending((prev) => {
					const next = { ...prev };
					delete next[key];
					return next;
				});
			}
		}
	};

	const handleMark = async (
		entry: RosterEntry,
		batch: Batch,
		next: "present" | "absent" | "clear",
	) => {
		const key = pendingKey(entry.memberId, batch);
		setError(null);
		setPending((prev) => ({
			...prev,
			[key]: { status: next === "clear" ? null : next },
		}));
		try {
			await markAttendance({
				data: {
					date: data.date,
					batch,
					memberId: entry.memberId,
					status: next,
				},
			});
		} catch (err) {
			setError(errorText(err));
		} finally {
			await reload(key);
		}
	};

	const handleAddGuest = async (
		batch: Batch,
		name: string,
		gameId: string,
	): Promise<boolean> => {
		setError(null);
		setBusy(true);
		try {
			await addGuestToSession({
				data: { date: data.date, batch, name, gameId },
			});
			await router.invalidate();
			return true;
		} catch (err) {
			setError(errorText(err));
			return false;
		} finally {
			setBusy(false);
		}
	};

	const openGuests = (batch: Batch) => {
		setError(null);
		setGuestBatch(batch);
	};

	const closeGuests = () => {
		setError(null);
		setGuestBatch(null);
	};

	const selectDate = (date: string) => {
		void navigate({ search: (prev) => ({ ...prev, date }) });
	};

	const selectMonth = (month: string) => {
		selectDate(dateInMonth(data.date, month));
	};

	const matches = (entry: RosterEntry) => {
		if (
			searchQuery &&
			!entry.name.toLowerCase().includes(searchQuery.toLowerCase())
		) {
			return false;
		}
		if (sportFilter !== "all" && !entry.sports.includes(sportFilter))
			return false;
		return true;
	};

	const showMorning = batchFilter === "all" || batchFilter === "morning";
	const showEvening = batchFilter === "all" || batchFilter === "evening";

	const morningRows = data.morning.filter(matches);
	const eveningRows = data.evening.filter(matches);

	const presentCount = [
		...data.morning.map((entry) => statusOf(entry, "morning")),
		...data.evening.map((entry) => statusOf(entry, "evening")),
	].filter((status) => status === "present").length;

	const roster = (batch: Batch, rows: RosterEntry[]) => (
		<div className="rounded-xl border border-border bg-background overflow-hidden">
			<div className="px-4 py-2.5 bg-secondary/50 border-b border-border flex items-center justify-between">
				<span className="text-xs font-extrabold text-foreground">
					{batchLabel[batch]}
				</span>
				<div className="flex items-center gap-3">
					<span className="text-[11px] font-bold text-muted-foreground">
						{rows.length} {rows.length === 1 ? "person" : "people"}
					</span>
					<button
						type="button"
						onClick={() => openGuests(batch)}
						className="flex items-center gap-1 h-7 px-2.5 text-xs font-semibold rounded-md bg-background border border-border text-foreground hover:bg-secondary"
					>
						<Plus className="w-3.5 h-3.5" />
						<span>Add guest</span>
					</button>
				</div>
			</div>
			<div>
				{rows.map((entry) => (
					<AttendeeCard
						key={`${entry.memberId}-${batch}`}
						name={entry.name}
						type={entry.type}
						sports={entry.sports}
						status={statusOf(entry, batch)}
						onMark={(next) => void handleMark(entry, batch, next)}
					/>
				))}
				{rows.length === 0 && (
					<div className="p-6 text-center text-xs text-muted-foreground">
						No one matches this view.
					</div>
				)}
			</div>
		</div>
	);

	return (
		<div className="flex flex-col flex-1">
			<MobileHeader title="Attendance" subtitle="Today's roll" />

			<MonthStepper month={monthOf(data.date)} onChange={selectMonth} />

			<DayScroller
				selectedDate={data.date}
				today={data.today}
				dots={data.dots}
				tallySummary={`${presentCount} present`}
				onSelect={selectDate}
			/>

			<div className="p-4 bg-background border-b border-border space-y-2.5">
				<SearchBar placeholder="Search by name…" />
				<div className="flex items-center gap-2 overflow-x-auto pb-0.5">
					<FilterChips
						paramName="batch"
						options={[
							{ label: "All batches", value: "all" },
							{ label: "Morning", value: "morning" },
							{ label: "Evening", value: "evening" },
						]}
					/>
					<span className="text-border">|</span>
					<FilterChips
						paramName="sport"
						options={[
							{ label: "All games", value: "all" },
							...data.games.map((game) => ({
								label: game.name,
								value: game.name,
							})),
						]}
					/>
				</div>
			</div>

			<div className="p-4 space-y-4">
				{error && !guestBatch && <Notice>{error}</Notice>}
				{showMorning && roster("morning", morningRows)}
				{showEvening && roster("evening", eveningRows)}
			</div>

			{guestBatch && (
				<AddGuestModal
					batchLabel={batchLabel[guestBatch]}
					games={data.games}
					guests={data[guestBatch].filter((entry) => entry.type === "guest")}
					busy={busy}
					error={error}
					onClose={closeGuests}
					onAdd={(name, gameId) => handleAddGuest(guestBatch, name, gameId)}
				/>
			)}
		</div>
	);
}
