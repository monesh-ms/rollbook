import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { MobileHeader } from "../../components/layout/mobile-header";
import {
	type PersonForm,
	PersonModal,
} from "../../components/people/register-modal";
import { LedgerTable } from "../../components/person/ledger-table";
import {
	type MonthActionInput,
	MonthActions,
} from "../../components/person/month-actions";
import {
	PaymentForm,
	type PaymentInput,
} from "../../components/person/payment-form";
import { VisitForm, type VisitInput } from "../../components/person/visit-form";
import { Notice } from "../../components/ui/notice";
import {
	getMemberLedger,
	updateMember,
	updateMemberStatus,
} from "../../lib/api/members";
import {
	adjustMonthlyFee,
	recordPayment,
	recordVisitCharge,
	reversePayment,
} from "../../lib/api/settle";
import { errorText, formatInr } from "../../lib/money";

export const Route = createFileRoute("/people/$id")({
	loader: ({ params }) => getMemberLedger({ data: { memberId: params.id } }),
	component: PersonPage,
});

function PersonPage() {
	const ledger = Route.useLoaderData();
	const router = useRouter();
	const { member } = ledger;
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [editing, setEditing] = useState(false);

	const isInactive = member.status === "inactive";
	const games = ledger.games.map((game) => ({
		id: game.id,
		name: game.name,
		guestVisitAmount: game.guestVisitAmount,
	}));

	const run = async (action: () => Promise<unknown>, onDone?: () => void) => {
		setError(null);
		setBusy(true);
		try {
			await action();
			onDone?.();
			await router.invalidate();
		} catch (err) {
			setError(errorText(err));
		} finally {
			setBusy(false);
		}
	};

	const handlePayment = (input: PaymentInput) =>
		run(() => recordPayment({ data: { memberId: member.id, ...input } }));

	const handleMonth = (input: MonthActionInput) =>
		run(() =>
			adjustMonthlyFee({
				data: {
					memberId: member.id,
					...input,
					reason: "Set on the person page",
				},
			}),
		);

	const handleVisit = (input: VisitInput) =>
		run(() => recordVisitCharge({ data: { memberId: member.id, ...input } }));

	const handleReverse = (paymentId: string) =>
		run(() =>
			reversePayment({ data: { paymentId, reason: "Reversed by management" } }),
		);

	const handleStatus = () =>
		run(() =>
			updateMemberStatus({
				data: {
					memberId: member.id,
					status: isInactive ? "active" : "inactive",
				},
			}),
		);

	const handleSave = (form: PersonForm) =>
		run(
			() => updateMember({ data: { memberId: member.id, ...form } }),
			() => setEditing(false),
		);

	const owed = ledger.owed;
	const isGuest = member.type === "guest";

	return (
		<div className="flex flex-col flex-1">
			<MobileHeader
				title={member.name}
				subtitle={`${member.type} · ${member.sports.join(", ")}`}
			/>

			<div className="p-4 space-y-4">
				<Link
					to="/people"
					className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground w-fit"
				>
					<ArrowLeft className="w-4 h-4" />
					<span>Back to people</span>
				</Link>

				<section className="p-4 rounded-xl border border-border bg-background space-y-2">
					<div className="flex items-start justify-between gap-3">
						<div>
							<h2 className="text-lg font-extrabold text-foreground">
								{member.name}
							</h2>
							<p className="text-xs text-muted-foreground capitalize">
								{member.type} · {member.batch} batch
								{isInactive && " · Inactive"}
							</p>
						</div>
						<div className="flex gap-2">
							<button
								type="button"
								disabled={busy}
								onClick={() => setEditing(true)}
								className="h-8 px-2.5 text-xs font-semibold rounded-lg border border-border hover:bg-secondary disabled:opacity-40"
							>
								Edit
							</button>
							<button
								type="button"
								disabled={busy}
								onClick={() => void handleStatus()}
								className="h-8 px-2.5 text-xs font-semibold rounded-lg border border-border hover:bg-secondary disabled:opacity-40"
							>
								{isInactive ? "Set active" : "Set inactive"}
							</button>
						</div>
					</div>
					{(member.contactNumber || member.address) && (
						<div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border flex-wrap">
							{member.contactNumber && (
								<a
									href={`tel:${member.contactNumber}`}
									className="flex items-center gap-1.5"
								>
									<Phone className="w-3.5 h-3.5" />
									<span>{member.contactNumber}</span>
								</a>
							)}
							{member.address && (
								<span className="flex items-center gap-1.5">
									<MapPin className="w-3.5 h-3.5" />
									<span>{member.address}</span>
								</span>
							)}
						</div>
					)}
				</section>

				<section className="p-4 rounded-xl border border-border bg-background">
					<span className="text-[11px] font-semibold text-muted-foreground">
						{owed < 0 ? "Credit with the academy" : "Owed now"}
					</span>
					<div className="mt-0.5 text-2xl font-extrabold mono-num text-foreground">
						{formatInr(Math.abs(owed))}
					</div>
					{!isGuest && (
						<p className="mt-1 text-xs text-muted-foreground">
							This month:{" "}
							{ledger.currentCharge?.amount === null
								? "amount not set yet"
								: formatInr(ledger.currentCharge?.amount ?? 0)}
						</p>
					)}
				</section>

				{error && <Notice>{error}</Notice>}

				{!isGuest && (
					<section className="p-4 rounded-xl border border-border bg-background space-y-4">
						<h3 className="text-xs font-bold text-foreground">
							Record payment
						</h3>
						<PaymentForm
							key={owed}
							suggested={Math.max(0, owed)}
							busy={busy}
							onSubmit={(input) => void handlePayment(input)}
						/>
					</section>
				)}

				{!isGuest && (
					<section className="p-4 rounded-xl border border-border bg-background space-y-4">
						<h3 className="text-xs font-bold text-foreground">Monthly fee</h3>
						<MonthActions
							currentMonth={ledger.currentMonth}
							busy={busy}
							onSubmit={(input) => void handleMonth(input)}
						/>
					</section>
				)}

				{member.type !== "member" && (
					<section className="p-4 rounded-xl border border-border bg-background space-y-4">
						<h3 className="text-xs font-bold text-foreground">Add a visit</h3>
						<VisitForm
							games={games}
							today={ledger.today}
							busy={busy}
							onSubmit={(input) => void handleVisit(input)}
						/>
					</section>
				)}

				<section className="p-4 rounded-xl border border-border bg-background">
					<h3 className="text-xs font-bold text-foreground mb-2">Log</h3>
					<p className="text-[11px] text-muted-foreground mb-2">
						Entries are never edited. A mistake is fixed with a reversal or a
						correction.
					</p>
					<LedgerTable
						lines={ledger.lines}
						busy={busy}
						onReverse={(id) => void handleReverse(id)}
					/>
				</section>
			</div>

			{editing && (
				<PersonModal
					title="Edit details"
					submitLabel="Save changes"
					games={games.map((game) => ({ id: game.id, name: game.name }))}
					initial={{
						name: member.name,
						type: member.type,
						batch: member.batch,
						gameIds: member.games.map((game) => game.id),
						contactNumber: member.contactNumber ?? undefined,
						address: member.address ?? undefined,
						customMonthlyAmount: member.customMonthlyAmount ?? undefined,
					}}
					busy={busy}
					error={error}
					onClose={() => setEditing(false)}
					onSubmit={(form) => void handleSave(form)}
				/>
			)}
		</div>
	);
}
