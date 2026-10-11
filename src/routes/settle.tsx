import { createFileRoute, useRouter } from "@tanstack/react-router";
import { parseAsString, useQueryState } from "nuqs";
import { useTransition } from "react";
import { MobileHeader } from "../components/layout/mobile-header";
import { SettleCard } from "../components/settle/settle-card";
import { SettleSummary } from "../components/settle/settle-summary";
import { FilterChips } from "../components/ui/filter-chips";
import { MonthStepper } from "../components/ui/month-stepper";
import { SearchBar } from "../components/ui/search-bar";
import { getMonthSettlement, recordPayment } from "../lib/api/settle";

export const Route = createFileRoute("/settle")({
	validateSearch: (
		search: Record<string, unknown>,
	): {
		month?: string;
		tab?: string;
		q?: string;
	} => ({
		month: (search.month as string) || "2026-10",
		tab: (search.tab as string) || "all",
		q: (search.q as string) || "",
	}),
	loaderDeps: ({ search }) => ({
		month: search.month || "2026-10",
	}),
	loader: async ({ deps }) => {
		const settleData = await getMonthSettlement({
			data: { month: deps.month },
		});
		return { settleData };
	},
	component: SettlePage,
});

function SettlePage() {
	const { settleData } = Route.useLoaderData();
	const router = useRouter();
	const [, startTransition] = useTransition();

	const [month] = useQueryState("month", parseAsString.withDefault("2026-10"));
	const [tabFilter] = useQueryState("tab", parseAsString.withDefault("all"));
	const [searchQuery] = useQueryState("q", parseAsString.withDefault(""));

	const handleQuickCollect = async (memberId: string, amountPaise: number) => {
		const method = confirm("Collect via UPI? Click Cancel for Cash.")
			? "upi"
			: "cash";
		try {
			await recordPayment({
				data: {
					memberId,
					amount: amountPaise,
					paymentMethod: method,
					notes: `Quick settlement for ${month}`,
				},
			});
			startTransition(() => {
				router.invalidate();
			});
		} catch (err) {
			console.error("Failed to record payment:", err);
			alert("Error recording payment");
		}
	};

	const filteredAccounts = settleData.accounts.filter((acc) => {
		if (
			searchQuery &&
			!acc.name.toLowerCase().includes(searchQuery.toLowerCase())
		) {
			return false;
		}
		if (tabFilter === "arrears" && acc.priorArrears <= 0) {
			return false;
		}
		if (tabFilter === "attended" && !acc.hasAttendanceThisMonth) {
			return false;
		}
		return true;
	});

	const monthLabel = new Date(`${month}-01`).toLocaleDateString("en-IN", {
		month: "long",
		year: "numeric",
	});

	return (
		<div className="flex flex-col flex-1">
			<MobileHeader title="Settle & Dues" subtitle={monthLabel} />

			<MonthStepper />

			<div className="p-4 bg-background border-b border-border space-y-3">
				<SettleSummary
					monthName={monthLabel}
					totalDuePaise={settleData.summary.totalDue}
					priorArrearsPaise={settleData.summary.priorArrears}
				/>

				<SearchBar placeholder="Search unsettled member..." />

				<div className="flex items-center gap-2 overflow-x-auto pb-0.5">
					<FilterChips
						paramName="tab"
						options={[
							{ label: `All (${settleData.accounts.length})`, value: "all" },
							{ label: "With Arrears", value: "arrears" },
							{ label: "Attended This Month", value: "attended" },
						]}
					/>
				</div>
			</div>

			<div className="p-4">
				<div className="rounded-xl border border-border bg-background overflow-hidden shadow-xs">
					<div className="px-4 py-2.5 bg-secondary/50 border-b border-border flex items-center justify-between">
						<span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
							Unsettled Members
						</span>
						<span className="text-[11px] font-bold text-muted-foreground">
							{filteredAccounts.length} Pending
						</span>
					</div>

					<div className="divide-y divide-border">
						{filteredAccounts.map((account) => (
							<SettleCard
								key={account.memberId}
								account={account}
								onQuickCollect={handleQuickCollect}
							/>
						))}

						{filteredAccounts.length === 0 && (
							<div className="p-8 text-center text-xs text-muted-foreground">
								All accounts settled for this view! ✓
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
