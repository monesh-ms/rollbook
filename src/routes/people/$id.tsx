import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Phone } from "lucide-react";
import { useTransition } from "react";
import { MobileHeader } from "../../components/layout/mobile-header";
import { FeeActionCard } from "../../components/person/fee-action-card";
import { LedgerTable } from "../../components/person/ledger-table";
import { getMemberLedger, updateMemberStatus } from "../../lib/api/members";
import {
	adjustMonthlyFee,
	recordPayment,
	reversePayment,
} from "../../lib/api/settle";

export const Route = createFileRoute("/people/$id")({
	loader: async ({ params }) => {
		const data = await getMemberLedger({ data: { memberId: params.id } });
		return { data };
	},
	component: PersonDetailPage,
});

function PersonDetailPage() {
	const { data } = Route.useLoaderData();
	const router = useRouter();
	const [, startTransition] = useTransition();

	const member = data.member;
	const isInactive = member.status === "inactive";

	const refresh = () => {
		startTransition(() => {
			router.invalidate();
		});
	};

	const handleCollectPayment = async (amountPaise: number) => {
		const method = confirm("Collect via UPI? Click Cancel for Cash.")
			? "upi"
			: "cash";
		try {
			await recordPayment({
				data: {
					memberId: member.id,
					amount: amountPaise,
					paymentMethod: method,
					notes: "Direct payment collection",
				},
			});
			refresh();
		} catch (err) {
			console.error("Failed to record payment:", err);
			alert("Error recording payment");
		}
	};

	const handleWaiveFee = async () => {
		const month = prompt("Enter month to waive (YYYY-MM):", "2026-10");
		if (!month) return;
		try {
			await adjustMonthlyFee({
				data: {
					memberId: member.id,
					month,
					action: "waive_no_fee",
				},
			});
			refresh();
		} catch (err) {
			console.error("Failed to waive fee:", err);
			alert("Error waiving fee");
		}
	};

	const handleSwitchToVisits = async (count: number) => {
		const month = prompt("Enter month to switch (YYYY-MM):", "2026-10");
		if (!month) return;
		try {
			await adjustMonthlyFee({
				data: {
					memberId: member.id,
					month,
					action: "switch_to_visits",
					visitCount: count,
				},
			});
			refresh();
		} catch (err) {
			console.error("Failed to switch to visits:", err);
			alert("Error adjusting fee");
		}
	};

	const handleToggleStatus = async (newStatus: "active" | "inactive") => {
		const reason = prompt(
			`Reason for setting to ${newStatus}:`,
			"Management update",
		);
		try {
			await updateMemberStatus({
				data: {
					memberId: member.id,
					status: newStatus,
					reason: reason || undefined,
				},
			});
			refresh();
		} catch (err) {
			console.error("Failed to update status:", err);
			alert("Error updating status");
		}
	};

	const handleReversePayment = async (paymentId: string) => {
		const reason = prompt("Reason for reversal:", "Mistaken entry");
		try {
			await reversePayment({
				data: {
					paymentId,
					reason: reason || undefined,
				},
			});
			refresh();
		} catch (err) {
			console.error("Failed to reverse payment:", err);
			alert("Error reversing payment");
		}
	};

	return (
		<div className="flex flex-col flex-1">
			<MobileHeader
				title={member.name}
				subtitle={`${member.type.toUpperCase()} • ${member.sports.join(", ")}`}
			/>

			<div className="p-4 bg-background border-b border-border space-y-3">
				<div className="flex items-center gap-2">
					<Link
						to="/people"
						className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
					>
						<ArrowLeft className="w-4 h-4" />
						<span>Back to People</span>
					</Link>
				</div>

				<div className="flex items-start justify-between">
					<div>
						<div className="flex items-center gap-2">
							<h2 className="text-lg font-extrabold text-foreground">
								{member.name}
							</h2>
							<span
								className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
									isInactive
										? "bg-muted text-muted-foreground border-border"
										: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
								}`}
							>
								{member.status}
							</span>
						</div>
						<p className="text-xs text-muted-foreground mt-0.5">
							Batch:{" "}
							<span className="capitalize font-semibold text-foreground">
								{member.batch}
							</span>
							{" • "}
							Sports:{" "}
							<span className="font-semibold text-foreground">
								{member.sports.join(", ")}
							</span>
						</p>
					</div>
				</div>

				{(member.contactNumber || member.address) && (
					<div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border flex-wrap">
						{member.contactNumber && (
							<a
								href={`tel:${member.contactNumber}`}
								className="flex items-center gap-1.5 hover:text-foreground"
							>
								<Phone className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
								<span>{member.contactNumber}</span>
							</a>
						)}
						{member.address && (
							<div className="flex items-center gap-1.5">
								<MapPin className="w-3.5 h-3.5 text-muted-foreground" />
								<span>{member.address}</span>
							</div>
						)}
					</div>
				)}
			</div>

			<div className="p-4 space-y-4">
				{/* Outstanding Dues & Fee Adjustment Actions */}
				<FeeActionCard
					memberId={member.id}
					suggestedBalancePaise={data.currentBalanceOwed}
					onCollectPayment={handleCollectPayment}
					onWaiveFee={handleWaiveFee}
					onSwitchToVisits={handleSwitchToVisits}
					onToggleStatus={handleToggleStatus}
					isInactive={isInactive}
				/>

				{/* Append-Only Financial Ledger */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
							Financial Ledger & Audit Trail
						</span>
						<span className="text-[11px] font-medium text-muted-foreground">
							{data.ledger.length} Transactions
						</span>
					</div>

					<LedgerTable
						items={data.ledger}
						onReversePayment={handleReversePayment}
					/>
				</div>
			</div>
		</div>
	);
}
