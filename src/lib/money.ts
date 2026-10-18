// Money is stored as integer paise. These helpers only convert for display and input.

export function formatInr(paise: number): string {
	const rupees = paise / 100;
	const sign = rupees < 0 ? "-" : "";
	return `${sign}₹${Math.abs(rupees).toLocaleString("en-IN", {
		maximumFractionDigits: 2,
	})}`;
}

/** Parses a rupee input into paise. Returns null when the input is empty or not a number. */
export function rupeesToPaise(input: string): number | null {
	if (input.trim() === "") return null;
	const value = Number(input);
	if (!Number.isFinite(value)) return null;
	return Math.round(value * 100);
}

export function errorText(err: unknown): string {
	if (err instanceof Error && err.message) return err.message;
	return "Something went wrong. Try again.";
}
