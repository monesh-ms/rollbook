import {
	createFileRoute,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { MobileHeader } from "../components/layout/mobile-header";
import {
	type PaymentDraft,
	SettleModal,
} from "../components/settle/settle-modal";
import { SettleRow } from "../components/settle/settle-row";
import { SettleSummary } from "../components/settle/settle-summary";
import { FilterChips } from "../components/ui/filter-chips";
import { MonthStepper } from "../components/ui/month-stepper";
import { Notice } from "../components/ui/notice";
import { SearchBar } from "../components/ui/search-bar";
import {
	adjustMonthlyFee,
	getMonthSettlement,
	recordPayment,
} from "../lib/api/settle";
import { errorText } from "../lib/money";

export const Route = createFileRoute("/settle")({
	validateSearch: (search: Record<string, unknown>): { month?: string } => ({
		month: typeof search.month === "string" ? search.month : undefined,
	}),
	loaderDeps: ({ search }) => ({ month: search.month }),
	loader: ({ deps }) =>
		getMonthSettlement({ data: deps.month ? { month: deps.month } : {} }),
	component: SettlePage,
});

function SettlePage() {
	const data = Route.useLoaderData();
	const router = useRouter();
	const navigate = useNavigate({ from: "/settle" });
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [tabFilter] = useQueryState("tab", parseAsString.withDefault("all"));
	const [searchQuery] = useQueryState("q", parseAsString.withDefault(""));

	const selected = data.accounts.find(
		(account) => account.memberId === selectedId,
	);

	const [year, monthNumber] = data.month.split("-").map(Number);
	const monthLabel = new Date(
		Date.UTC(year, monthNumber - 1, 1),
	).toLocaleDateString("en-IN", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	});

	const selectMonth = (month: string) => {
		void navigate({ search: (prev) => ({ ...prev, month }) });
	};

	const openAccount = (memberId: string) => {
		setError(null);
		setSelectedId(memberId);
	};

	const closeAccount = () => {
		setError(null);
		setSelectedId(null);
	};

	/** Returns true when the change was saved. A failed change keeps the popup open with the message. */
	const runAction = async (
		action: () => Promise<unknown>,
	): Promise<boolean> => {
		setError(null);
		setBusy(true);
		try {
			await action();
			await router.invalidate();
			return true;
		} catch (err) {
			setError(errorText(err));
			return false;
		} finally {
			setBusy(false);
		}
	};

	const handlePay = async (draft: PaymentDraft) => {
		const saved = await runAction(() =>
			recordPayment({
				data: {
					memberId: draft.memberId,
					amount: draft.amount,
					paymentMethod: draft.paymentMethod,
				},
			}),
		);
		if (saved) setSelectedId(null);
	};

	const handleSetAmount = async (memberId: string, amount: number) => {
		const saved = await runAction(() =>
			adjustMonthlyFee({
				data: {
					memberId,
					month: data.month,
					action: "set_amount",
					amount,
				},
			}),
		);
		if (saved) setSelectedId(null);
	};

	const accounts = data.accounts.filter((account) => {
		if (
			searchQuery &&
			!account.name.toLowerCase().includes(searchQuery.toLowerCase())
		) {
			return false;
		}
		if (tabFilter === "arrears" && account.carriedOver <= 0) return false;
		if (tabFilter === "attended" && !account.hasAttendanceThisMonth)
			return false;
		return true;
	});

	return (
		<div className="flex flex-col flex-1">
			<MobileHeader title="Settle" subtitle={monthLabel} />

			<MonthStepper month={data.month} onChange={selectMonth} />

			<div className="p-4 bg-background border-b border-border space-y-3">
				<SettleSummary
					monthLabel={monthLabel}
					totalOwed={data.summary.totalOwed}
					carriedOver={data.summary.carriedOver}
					unsettledCount={data.summary.unsettledCount}
					needsAmountCount={data.summary.needsAmountCount}
				/>

				<SearchBar placeholder="Search by name…" />

				<div className="flex items-center gap-2 overflow-x-auto pb-0.5">
					<FilterChips
						paramName="tab"
						options={[
							{ label: `All (${data.accounts.length})`, value: "all" },
							{ label: "From earlier months", value: "arrears" },
							{ label: "Marked this month", value: "attended" },
						]}
					/>
				</div>
			</div>

			<div className="p-4 space-y-4">
				{error && !selected && <Notice>{error}</Notice>}
				<div className="rounded-xl border border-border bg-background overflow-hidden">
					{accounts.map((account) => (
						<SettleRow
							key={account.memberId}
							account={account}
							onOpen={() => openAccount(account.memberId)}
						/>
					))}
					{accounts.length === 0 && (
						<div className="p-8 text-center text-sm text-muted-foreground">
							Nobody left to settle in this view.
						</div>
					)}
				</div>
			</div>

			{selected && (
				<SettleModal
					account={selected}
					monthLabel={monthLabel}
					busy={busy}
					error={error}
					onClose={closeAccount}
					onPay={(draft) => void handlePay(draft)}
					onSetAmount={(memberId, amount) =>
						void handleSetAmount(memberId, amount)
					}
				/>
			)}
		</div>
	);
}
