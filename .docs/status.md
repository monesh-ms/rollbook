# Status

As of 2026-10-11.

## Current state

- **Database & Persistence:** Locked 9-table Drizzle schema (`drizzle/0000_faithful_the_hood.sql`) migrated into `dev.db` using native `bun:sqlite`. Seeded initial MS Sports Academy records, sports (Badminton, Tennis), 6 members, fees, and payments via `src/db/seed.ts`.
- **Server API Functions (`@tanstack/react-start`):**
  - `src/lib/api/attendance.ts`: `getAttendanceByDate`, `markAttendance`, `quickAddAttendee`, `getMonthAttendanceDots`.
  - `src/lib/api/settle.ts`: `getMonthSettlement`, `recordPayment`, `recordGuestVisitAndPayment`, `adjustMonthlyFee`, `reversePayment`.
  - `src/lib/api/members.ts`: `getMembers`, `registerMember`, `getMemberLedger`, `updateMemberStatus`.
  - `src/lib/api/settings.ts`: `getSettings`, `updateGameRates`.
- **Frontend Routes & Components (`< 300 lines` strict invariant):**
  - Permanent bottom tab navigation (`Today`, `Settle`, `People`, `Settings`) in `src/components/layout/bottom-nav.tsx` and `src/routes/__root.tsx`.
  - URL state management powered by `nuqs` across all filters, month steppers, and search bars.
  - `/attendance`: 1-tap roll call, interactive day scroller with attendance dots, filter chips, quick add attendee row.
  - `/settle`: Month settlement summary, arrears breakdown, quick collection actions (Cash/UPI).
  - `/people`: Member roster, search by name/mobile, category filter chips, member registration modal.
  - `/people/$id`: Detailed player ledger, balance summary, fee waiver, switch to visit charges, active/inactive toggle, payment reversal.
  - `/settings`: Academy details, live editable sports pricing with instant persistence.
- **Verification:**
  - `bun run --bun tsc --noEmit` exits with code 0 (zero errors).
  - `bun run --bun check src/` exits with code 0 (zero errors).
  - `bun run --bun build` successfully generates full client & Nitro bundle in 510ms.

## Next

- Finalize Clerk authentication integration when ready for multi-tenant deployment.
- Optional PWA service worker manifest for installable mobile icon.

## Open questions

None.
