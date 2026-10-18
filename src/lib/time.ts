// Academy calendar helpers. Sessions and months use the academy's local calendar
// in its timezone, never UTC. Dates are 'YYYY-MM-DD', months are 'YYYY-MM'.

const dayFormatters = new Map<string, Intl.DateTimeFormat>();

export function localDate(instant: Date, timeZone: string): string {
	let formatter = dayFormatters.get(timeZone);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat("en-CA", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
		dayFormatters.set(timeZone, formatter);
	}
	return formatter.format(instant);
}

export function localMonth(instant: Date, timeZone: string): string {
	return localDate(instant, timeZone).slice(0, 7);
}

export function todayIn(timeZone: string, now: Date = new Date()): string {
	return localDate(now, timeZone);
}

export function monthOf(date: string): string {
	return date.slice(0, 7);
}

export function addMonths(month: string, delta: number): string {
	const [year, monthNumber] = month.split("-").map(Number);
	const total = year * 12 + (monthNumber - 1) + delta;
	const nextYear = Math.floor(total / 12);
	const nextMonth = (total % 12) + 1;
	return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}

/** Every month from start to end, both included. Empty when start is after end. */
export function monthsBetween(start: string, end: string): string[] {
	const months: string[] = [];
	for (let month = start; month <= end; month = addMonths(month, 1)) {
		months.push(month);
	}
	return months;
}

/** Clamps a date into another month, keeping the day number where possible. */
export function dateInMonth(date: string, month: string): string {
	const day = Number(date.slice(8, 10));
	const [year, monthNumber] = month.split("-").map(Number);
	const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
	const clamped = Math.min(day, lastDay);
	return `${month}-${String(clamped).padStart(2, "0")}`;
}

/** True for a real calendar date in 'YYYY-MM-DD' form (rejects 2026-02-30). */
export function isCalendarDate(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return (
		date.getUTCFullYear() === year &&
		date.getUTCMonth() === month - 1 &&
		date.getUTCDate() === day
	);
}
