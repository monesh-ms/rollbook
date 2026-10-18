import { db } from "./index";
import {
	academies,
	attendance,
	games,
	memberGames,
	memberStatusLogs,
	members,
	monthlyFees,
	payments,
} from "./schema";

export async function seedDatabase() {
	console.log("Seeding RollBook database...");

	// 1. Academy Tenant
	const academyId = "acad_ms_sports";
	await db
		.insert(academies)
		.values({
			id: academyId,
			name: "MS Sports Academy",
			timezone: "Asia/Kolkata",
			currency: "INR",
		})
		.onConflictDoNothing();

	// 2. Games / Sports
	const gameBadminton = "game_badminton";
	const gameTennis = "game_tennis";

	await db
		.insert(games)
		.values([
			{
				id: gameBadminton,
				academyId,
				name: "Badminton",
				memberMonthlyAmount: 300000, // ₹3,000 in paise
				studentMonthlyAmount: 200000, // ₹2,000
				guestVisitAmount: 40000, // ₹400
			},
			{
				id: gameTennis,
				academyId,
				name: "Tennis",
				memberMonthlyAmount: 450000, // ₹4,500
				studentMonthlyAmount: 350000, // ₹3,500
				guestVisitAmount: 70000, // ₹700
			},
		])
		.onConflictDoNothing();

	// 3. Members
	const sampleMembers = [
		{
			id: "mem_kabir",
			academyId,
			name: "Kabir Sen",
			type: "student" as const,
			batch: "morning" as const,
			contactNumber: "94444 55555",
			address: "12 Garden View",
			status: "active" as const,
		},
		{
			id: "mem_asha",
			academyId,
			name: "Asha Iyer",
			type: "student" as const,
			batch: "morning" as const,
			contactNumber: "90000 00000",
			address: "14 Sample Lane",
			status: "active" as const,
		},
		{
			id: "mem_dev",
			academyId,
			name: "Dev Shah",
			type: "member" as const,
			batch: "evening" as const,
			contactNumber: "98888 11111",
			address: "22 Park View",
			status: "active" as const,
		},
		{
			id: "mem_meera",
			academyId,
			name: "Meera Nair",
			type: "student" as const,
			batch: "both" as const,
			contactNumber: "97777 22222",
			address: "5 Temple Road",
			status: "active" as const,
			customMonthlyAmount: 550000, // ₹5,500 hand-typed for 2 sports
		},
		{
			id: "mem_ravi",
			academyId,
			name: "Ravi Menon",
			type: "member" as const,
			batch: "morning" as const,
			contactNumber: "96666 33333",
			address: "8 Lake Road",
			status: "inactive" as const,
		},
		{
			id: "mem_leela",
			academyId,
			name: "Leela Das",
			type: "guest" as const,
			batch: "evening" as const,
			contactNumber: "95555 44444",
			address: "44 Cross St",
			status: "active" as const,
		},
	];

	for (const m of sampleMembers) {
		await db.insert(members).values(m).onConflictDoNothing();
	}

	// 4. Member to Games
	await db
		.insert(memberGames)
		.values([
			{ id: "mg_1", academyId, memberId: "mem_kabir", gameId: gameBadminton },
			{ id: "mg_2", academyId, memberId: "mem_asha", gameId: gameBadminton },
			{ id: "mg_3", academyId, memberId: "mem_dev", gameId: gameTennis },
			{ id: "mg_4", academyId, memberId: "mem_meera", gameId: gameTennis },
			{ id: "mg_5", academyId, memberId: "mem_meera", gameId: gameBadminton },
			{ id: "mg_6", academyId, memberId: "mem_ravi", gameId: gameBadminton },
			{ id: "mg_7", academyId, memberId: "mem_leela", gameId: gameTennis },
		])
		.onConflictDoNothing();

	// 5. Inactive status log for Ravi
	await db
		.insert(memberStatusLogs)
		.values({
			id: "log_ravi_1",
			academyId,
			memberId: "mem_ravi",
			status: "inactive",
			reason: "Stopped attending without notice in late September",
		})
		.onConflictDoNothing();

	// 6. Attendance for Today (2026-10-11) and Yesterday (2026-10-10)
	await db
		.insert(attendance)
		.values([
			{
				id: "att_today_1",
				academyId,
				date: "2026-10-11",
				batch: "morning",
				memberId: "mem_kabir",
				status: "present",
			},
			{
				id: "att_today_2",
				academyId,
				date: "2026-10-11",
				batch: "evening",
				memberId: "mem_dev",
				status: "present",
			},
			{
				id: "att_today_3",
				academyId,
				date: "2026-10-11",
				batch: "evening",
				memberId: "mem_leela",
				status: "present",
			},
			{
				id: "att_yest_1",
				academyId,
				date: "2026-10-10",
				batch: "morning",
				memberId: "mem_kabir",
				status: "present",
			},
			{
				id: "att_yest_2",
				academyId,
				date: "2026-10-10",
				batch: "evening",
				memberId: "mem_dev",
				status: "present",
			},
		])
		.onConflictDoNothing();

	// 7. Monthly Fees for September (Past) & October (Current)
	await db
		.insert(monthlyFees)
		.values([
			// September fees
			{
				id: "mf_sep_asha",
				academyId,
				memberId: "mem_asha",
				month: "2026-09",
				amountDue: 200000,
				status: "standard",
			},
			{
				id: "mf_sep_ravi",
				academyId,
				memberId: "mem_ravi",
				month: "2026-09",
				amountDue: 150000,
				status: "standard",
			},
			{
				id: "mf_sep_dev",
				academyId,
				memberId: "mem_dev",
				month: "2026-09",
				amountDue: 450000,
				status: "standard",
			},
			// October fees
			{
				id: "mf_oct_asha",
				academyId,
				memberId: "mem_asha",
				month: "2026-10",
				amountDue: 200000,
				status: "standard",
			},
			{
				id: "mf_oct_dev",
				academyId,
				memberId: "mem_dev",
				month: "2026-10",
				amountDue: 450000,
				status: "standard",
			},
			{
				id: "mf_oct_meera",
				academyId,
				memberId: "mem_meera",
				month: "2026-10",
				amountDue: 550000,
				status: "standard",
				notes: "Two games hand-typed",
			},
		])
		.onConflictDoNothing();

	// 8. Historical Payments
	await db
		.insert(payments)
		.values([
			// Asha paid ₹1,000 partial for September on 12 Sep 2026 (Leaving ₹1,000 carryover)
			{
				id: "pay_sep_asha",
				academyId,
				memberId: "mem_asha",
				amount: 100000,
				paymentMethod: "upi",
				notes: "Partial payment for September fee",
				paidAt: new Date("2026-09-12T10:00:00+05:30"),
			},
			// Dev paid ₹4,500 for September on 28 Sep 2026
			{
				id: "pay_sep_dev",
				academyId,
				memberId: "mem_dev",
				amount: 450000,
				paymentMethod: "cash",
				notes: "September full settlement",
				paidAt: new Date("2026-09-28T10:00:00+05:30"),
			},
		])
		.onConflictDoNothing();

	console.log("Seed data inserted successfully.");
}

// Self-run when executed directly
if (import.meta.main) {
	seedDatabase()
		.then(() => process.exit(0))
		.catch((err) => {
			console.error("Seed error:", err);
			process.exit(1);
		});
}
