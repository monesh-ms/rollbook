// Input rules for every server function. Money is integer paise.

import { z } from "zod";
import { isCalendarDate } from "../time";

export const calendarDate = z
	.string()
	.refine(isCalendarDate, "Use a real date as YYYY-MM-DD");

export const calendarMonth = z
	.string()
	.regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use a month as YYYY-MM");

export const recordId = z.string().min(1).max(120);

export const paise = z
	.number()
	.int("Amount must be whole paise")
	.min(0, "Amount cannot be negative")
	.max(100_000_000, "Amount is too large");

export const positivePaise = paise.min(1, "Amount must be more than zero");

export const personName = z.string().trim().min(1, "Name is required").max(80);

export const shortNote = z.string().trim().max(200);

export const batch = z.enum(["morning", "evening"]);

export const personBatch = z.enum(["morning", "evening", "both"]);

export const personType = z.enum(["member", "student", "guest"]);

export const phone = z
	.string()
	.trim()
	.regex(/^[0-9+ ]{6,20}$/, "Phone can only hold digits, spaces and +")
	.optional()
	.or(z.literal("").transform(() => undefined));
