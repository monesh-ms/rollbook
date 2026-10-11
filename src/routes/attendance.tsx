import { createFileRoute, useRouter } from "@tanstack/react-router";
import { parseAsString, useQueryState } from "nuqs";
import { useState, useTransition } from "react";
import { AddPlayerRow } from "../components/attendance/add-player-row";
import { AttendeeCard } from "../components/attendance/attendee-card";
import { DayScroller } from "../components/attendance/day-scroller";
import { MobileHeader } from "../components/layout/mobile-header";
import { FilterChips } from "../components/ui/filter-chips";
import { MonthStepper } from "../components/ui/month-stepper";
import { SearchBar } from "../components/ui/search-bar";
import {
	getAttendanceByDate,
	getMonthAttendanceDots,
	markAttendance,
	quickAddAttendee,
} from "../lib/api/attendance";

export const Route = createFileRoute("/attendance")({
	validateSearch: (
		search: Record<string, unknown>,
	): {
		month?: string;
		date?: string;
		batch?: string;
		sport?: string;
		q?: string;
	} => ({
		month: (search.month as string) || "2026-10",
		date: (search.date as string) || "2026-10-11",
		batch: (search.batch as string) || "all",
		sport: (search.sport as string) || "all",
		q: (search.q as string) || "",
	}),
	loaderDeps: ({ search }) => ({
		date: search.date || "2026-10-11",
		month: search.month || "2026-10",
	}),
	loader: async ({ deps }) => {
		const [attData, dots] = await Promise.all([
			getAttendanceByDate({ data: { date: deps.date } }),
			getMonthAttendanceDots({ data: { month: deps.month } }),
		]);
		return { attData, dots };
	},
	component: AttendancePage,
});

function AttendancePage() {
	const { attData, dots } = Route.useLoaderData();
	const router = useRouter();
	const [, startTransition] = useTransition();

	const [date] = useQueryState("date", parseAsString.withDefault("2026-10-11"));
	const [month] = useQueryState("month", parseAsString.withDefault("2026-10"));
	const [batchFilter] = useQueryState(
		"batch",
		parseAsString.withDefault("all"),
	);
	const [sportFilter] = useQueryState(
		"sport",
		parseAsString.withDefault("all"),
	);
	const [searchQuery] = useQueryState("q", parseAsString.withDefault(""));

	// Local optimistic attendance map
	const [optimisticMarks, setOptimisticMarks] = useState<
		Record<string, "present" | "absent">
	>({});

	const handleToggle = async (
		memberId: string,
		batch: "morning" | "evening",
		status: "present" | "absent",
	) => {
		const key = `${memberId}_${batch}`;
		setOptimisticMarks((prev) => ({ ...prev, [key]: status }));

		try {
			await markAttendance({
				data: {
					date,
					batch,
					memberId,
					status,
				},
			});
			startTransition(() => {
				router.invalidate();
			});
		} catch (err) {
			console.error("Failed to mark attendance:", err);
		}
	};

	const handleAddPlayer = async (
		name: string,
		batch: "morning" | "evening",
	) => {
		try {
			await quickAddAttendee({
				data: {
					name,
					batch,
					date,
				},
			});
			startTransition(() => {
				router.invalidate();
			});
		} catch (err) {
			console.error("Failed to quick add attendee:", err);
		}
	};

	const filterList = (list: typeof attData.morning) => {
		return list.filter((item) => {
			if (
				searchQuery &&
				!item.name.toLowerCase().includes(searchQuery.toLowerCase())
			) {
				return false;
			}
			if (sportFilter !== "all" && !item.sports.includes(sportFilter)) {
				return false;
			}
			return true;
		});
	};

	const morningFiltered = filterList(attData.morning);
	const eveningFiltered = filterList(attData.evening);

	const showMorning = batchFilter === "all" || batchFilter === "morning";
	const showEvening = batchFilter === "all" || batchFilter === "evening";

	const totalPresent =
		attData.summary.presentCount +
		Object.values(optimisticMarks).filter((s) => s === "present").length -
		Object.entries(optimisticMarks).filter(
			([k, s]) =>
				s === "absent" &&
				attData.morning
					.concat(attData.evening)
					.find((i) => `${i.memberId}_${i.batch}` === k)?.status === "present",
		).length;

	return (
		<div className="flex flex-col flex-1">
			<MobileHeader title="Attendance" subtitle="1-Tap Roll Call" />

			{/* Month Filter */}
			<MonthStepper />

			{/* Day Scroller */}
			<DayScroller
				selectedMonth={month}
				dots={dots}
				tallySummary={`${Math.max(0, totalPresent)} Present`}
			/>

			{/* Search & Filters */}
			<div className="p-4 bg-background border-b border-border space-y-2.5">
				<SearchBar placeholder="Search attendee by name..." />
				<div className="flex items-center gap-2 overflow-x-auto pb-0.5">
					<FilterChips
						paramName="batch"
						options={[
							{ label: "All Batches", value: "all" },
							{ label: "Morning", value: "morning" },
							{ label: "Evening", value: "evening" },
						]}
					/>
					<span className="text-border">|</span>
					<FilterChips
						paramName="sport"
						options={[
							{ label: "All Sports", value: "all" },
							{ label: "Badminton", value: "Badminton" },
							{ label: "Tennis", value: "Tennis" },
						]}
					/>
				</div>
			</div>

			{/* Rosters */}
			<div className="p-4 space-y-4">
				{showMorning && (
					<div className="rounded-xl border border-border bg-background overflow-hidden shadow-xs">
						<div className="px-4 py-2.5 bg-secondary/50 border-b border-border flex items-center justify-between">
							<span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
								Morning Batch (6:00 - 9:00 AM)
							</span>
							<span className="text-[11px] font-bold text-muted-foreground">
								{morningFiltered.length} Members
							</span>
						</div>
						<div className="divide-y divide-border">
							{morningFiltered.map((item) => (
								<AttendeeCard
									key={item.id}
									id={item.id}
									memberId={item.memberId}
									name={item.name}
									type={item.type}
									sports={item.sports}
									status={
										optimisticMarks[`${item.memberId}_morning`] ?? item.status
									}
									onToggleStatus={(newStatus) =>
										handleToggle(item.memberId, "morning", newStatus)
									}
								/>
							))}
							{morningFiltered.length === 0 && (
								<div className="p-6 text-center text-xs text-muted-foreground">
									No attendees matching filter.
								</div>
							)}
						</div>
						<AddPlayerRow
							batch="morning"
							onAddPlayer={(name) => handleAddPlayer(name, "morning")}
						/>
					</div>
				)}

				{showEvening && (
					<div className="rounded-xl border border-border bg-background overflow-hidden shadow-xs">
						<div className="px-4 py-2.5 bg-secondary/50 border-b border-border flex items-center justify-between">
							<span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
								Evening Batch (4:30 - 8:00 PM)
							</span>
							<span className="text-[11px] font-bold text-muted-foreground">
								{eveningFiltered.length} Members
							</span>
						</div>
						<div className="divide-y divide-border">
							{eveningFiltered.map((item) => (
								<AttendeeCard
									key={item.id}
									id={item.id}
									memberId={item.memberId}
									name={item.name}
									type={item.type}
									sports={item.sports}
									status={
										optimisticMarks[`${item.memberId}_evening`] ?? item.status
									}
									onToggleStatus={(newStatus) =>
										handleToggle(item.memberId, "evening", newStatus)
									}
								/>
							))}
							{eveningFiltered.length === 0 && (
								<div className="p-6 text-center text-xs text-muted-foreground">
									No attendees matching filter.
								</div>
							)}
						</div>
						<AddPlayerRow
							batch="evening"
							onAddPlayer={(name) => handleAddPlayer(name, "evening")}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
