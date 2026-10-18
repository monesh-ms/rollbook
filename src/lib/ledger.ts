// Money rules for members, students and guests. Pure functions, no database.
// Amounts are integer paise. A payment reduces what is owed; a reversal adds it back.

import { addMonths, monthsBetween } from "./time";

export type PersonType = "member" | "student" | "guest";
export type FeeAction = "set_amount" | "waive_no_fee" | "switch_to_visits";

export interface GameRates {
	id: string;
	name: string;
	memberMonthlyAmount: number;
	studentMonthlyAmount: number;
	guestVisitAmount: number;
}

export interface PersonLedger {
	type: PersonType;
	games: GameRates[];
	customMonthlyAmount: number | null;
	joinMonth: string;
	/** Month the person was set inactive. No monthly fee from that month on. null when active. */
	inactiveSince: string | null;
	/** Settled months: the amount that was frozen when the month was paid off. */
	frozen: Array<{ month: string; amountDue: number }>;
	/** Management corrections, oldest first. The latest one for a month is the amount used. */
	adjustments: Array<{ month: string; amountAfter: number; action: FeeAction }>;
	visits: Array<{ date: string; amount: number; label?: string }>;
	payments: Array<{
		date: string;
		amount: number;
		reversal: boolean;
		label?: string;
	}>;
}

export type ChargeSource = "live" | "frozen" | "adjusted" | "none";

export interface MonthCharge {
	month: string;
	/** Monthly fee for the month. null means management still has to type the amount. */
	amount: number | null;
	source: ChargeSource;
}

/**
 * The fee the settings suggest for one person. A hand-typed custom amount wins.
 * Two or more games have no calculated total, so this returns null for them.
 */
export function suggestMonthlyAmount(
	person: Pick<PersonLedger, "type" | "games" | "customMonthlyAmount">,
): number | null {
	if (person.type === "guest") return null;
	if (person.customMonthlyAmount !== null) return person.customMonthlyAmount;
	if (person.games.length !== 1) return null;
	const [game] = person.games;
	return person.type === "member"
		? game.memberMonthlyAmount
		: game.studentMonthlyAmount;
}

function earliest(months: string[]): string {
	return months.reduce((a, b) => (b < a ? b : a));
}

/** The monthly fee for every month from the first relevant month up to endMonth. */
export function monthlyCharges(
	person: PersonLedger,
	endMonth: string,
): MonthCharge[] {
	const relevant = [
		person.joinMonth,
		...person.frozen.map((row) => row.month),
		...person.adjustments.map((row) => row.month),
		...person.visits.map((row) => row.date.slice(0, 7)),
		...person.payments.map((row) => row.date.slice(0, 7)),
	];
	const start = earliest(relevant);

	const frozen = new Map(
		person.frozen.map((row) => [row.month, row.amountDue]),
	);
	const adjusted = new Map(
		person.adjustments.map((row) => [row.month, row.amountAfter]),
	);
	const suggestion = suggestMonthlyAmount(person);

	return monthsBetween(start, endMonth).map((month): MonthCharge => {
		if (person.type === "guest") return { month, amount: 0, source: "none" };
		if (adjusted.has(month)) {
			return { month, amount: adjusted.get(month) ?? 0, source: "adjusted" };
		}
		if (frozen.has(month)) {
			return { month, amount: frozen.get(month) ?? 0, source: "frozen" };
		}
		if (person.inactiveSince !== null && month >= person.inactiveSince) {
			return { month, amount: 0, source: "none" };
		}
		return { month, amount: suggestion, source: "live" };
	});
}

export function chargeFor(person: PersonLedger, month: string): MonthCharge {
	return (
		monthlyCharges(person, month).find((c) => c.month === month) ?? {
			month,
			amount: 0,
			source: "none",
		}
	);
}

/** Net amount still owed at the end of the given month. Negative means credit. */
export function owedThrough(person: PersonLedger, month: string): number {
	let owed = 0;
	for (const charge of monthlyCharges(person, month)) {
		owed += charge.amount ?? 0;
	}
	for (const visit of person.visits) {
		if (visit.date.slice(0, 7) <= month) owed += visit.amount;
	}
	for (const payment of person.payments) {
		if (payment.date.slice(0, 7) > month) continue;
		owed += payment.reversal ? payment.amount : -payment.amount;
	}
	return owed;
}

export function visitsIn(person: PersonLedger, month: string): number {
	return person.visits
		.filter((visit) => visit.date.slice(0, 7) === month)
		.reduce((sum, visit) => sum + visit.amount, 0);
}

/** Net payments received in the month. Reversals reduce this. */
export function paidIn(person: PersonLedger, month: string): number {
	return person.payments
		.filter((payment) => payment.date.slice(0, 7) === month)
		.reduce(
			(sum, payment) =>
				sum + (payment.reversal ? -payment.amount : payment.amount),
			0,
		);
}

/**
 * Months whose live suggestion is covered by payments. Freezing them keeps the
 * settled amount when rates change later.
 */
export function monthsToFreeze(
	person: PersonLedger,
	endMonth: string,
): Array<{ month: string; amountDue: number }> {
	return monthlyCharges(person, endMonth)
		.filter(
			(charge) =>
				charge.source === "live" &&
				charge.amount !== null &&
				owedThrough(person, charge.month) <= 0,
		)
		.map((charge) => ({
			month: charge.month,
			amountDue: charge.amount ?? 0,
		}));
}

export function previousMonth(month: string): string {
	return addMonths(month, -1);
}
