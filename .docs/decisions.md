# Decisions

## 2026-10-11 — Web version before the installable app

Partly superseded 2026-10-18: install-to-home-screen is allowed now. See "Installable web app with an offline page; no cached data" below. The offline queue part still stands.

Build the website first. Do not add install-to-home-screen or an offline queue in this phase.

Why: attendance and payments have to be correct before they are available offline. An offline queue that retries writes is only safe once the web writes are already idempotent, which they must be anyway.

Rejected: building the installable, offline-capable app first. That would mix two hard problems (correct marks and balances, and offline sync) before either is proven.

What this does not change: attendance writes stay idempotent, and a session date is the academy's local calendar date, not UTC. Those rules are in `AGENTS.md` and are what a later offline queue will rely on.

## 2026-10-11 — Plain UI

Superseded 2026-10-11: see "Clean, modern UI prototype" below.

The interface stays simple, clean, and minimal. No decorative dashboards, charts, or extra visual effects.

Why: the owner asked for a tool that stays out of the way. The work is marking attendance and keeping balances correct.

Rejected: a feature-heavy admin theme. It would add surface area without making a mark or a balance more correct.

## 2026-10-11 — Clean, modern UI prototype

The interface is modern, clean, and distinctive: refined typography (Plus Jakarta Sans and tabular numbers for currency), athletic color accents (emerald for present/settled, amber for custom/pending, rose for arrears), tactile segmented toggles for fast attendance, and high-clarity status tags for carryover balances.

Why: the owner rejected the generic wireframe style ("seen in 1000+ sites") in favor of a clean, modern, and polished interface designed for operational speed without visual clutter.

Rejected: generic monochrome wireframes, and overly decorative chart-heavy themes that distract from correct attendance and fee records.

## 2026-10-11 — Mobile-first navigation with bottom tab bar, month-level filtering, and day-level attendance scroller

The primary interface targets mobile screens used on courts. The layout replaces sidebars and hamburger menus with a thumb-friendly bottom tab bar (`[Attendance] [Settle] [People] [Settings]`). Attendance and Settle default to a month-level filter (`< October 2026 >`). Attendance includes a horizontal calendar day scroller to quickly inspect and edit historical session logs with one tap. Instant zero-click search is integrated across rosters.

Why: the owner clarified that mobile is the primary screen. Sidebars add unnecessary friction and hide core tabs behind extra taps. Coaches and managers need to rapidly check and edit recent days on the courts without navigating deep menus.

Rejected: collapsible sidebars and multi-level date picker dialogs requiring multiple clicks.

## 2026-10-11 — Database schema locked with 9 tables, direct sessionless attendance, and 3-table financial model

The database schema is locked in Drizzle ORM / SQLite across 9 tables:
1. `academies`: Tenant root with timezone and currency.
2. `games`: Sports list and pricing tiers (member monthly, student monthly, guest visit) in integer minor units (paise).
3. `members`: People roster with categories (`member`, `student`, `guest`), batch (`morning`, `evening`, `both`), active/inactive status, and `custom_monthly_amount` to freeze hand-typed multi-game rates.
4. `member_games`: Many-to-many junction table for multi-sport enrollment.
5. `member_status_logs`: History audit tracking when members switch between active and inactive with reasons.
6. `attendance`: Flattened attendance table storing `date` and `batch` directly on the row with a compound unique index on `(academy_id, date, batch, member_id)`. No separate sessions table.
7. `monthly_fees`: Month-end subscription records for regular members and students.
8. `visit_charges`: On-the-spot per-visit charges for guests and short-stay students.
9. `payments`: Immutable, append-only log of all money received (cash/UPI) with `reversal_of_id` self-referencing corrections.

Why: eliminating a separate `sessions` table eliminates ceremony and extra joins, making mobile marking atomic and offline-ready. Separating `monthly_fees` from on-the-spot `visit_charges` maps directly to real-world operations where guests pay on arrival while members settle monthly.

Rejected: an abstract single-ledger model using negative charges for fee waivers, and a separate `sessions` parent table.

## 2026-10-11 — The app stores fee logs; it does not invent prices

Settings hold amounts the admin can change. A charge is a log of the amount actually used. Correcting a charge does not change later months; the next month follows the settings again. Payments stay append-only.

Why: the owner said a multi-game fee is higher, and that it differs for members and students, but the software does not know the real figure. The app's job is to store what the admin entered.

Rejected: a built-in formula that charges "slightly more" for a second game. That would post a balance the owner had not set.

## 2026-10-11 — Short-stay students are visit charges, not a day count

A student is monthly by default. If they are only attending for a few days, management charges each visit the way a guest is charged, and does not also charge that month. A member is never charged per visit.

Why: the owner said a short visit is charged like a guest. The examples were 2 days and 5 days. Those are examples, not a threshold the software can apply.

Rejected: counting attendance days and automatically replacing the monthly fee. A wrong cutoff would post a wrong balance.

## 2026-10-11 — Sign in with Clerk, public sign-up blocked

Superseded 2026-10-14: see "No sign-in for now" below.

Use Clerk. The academy creates the users and gives them access. Public sign-up is blocked.

Why: the owner will create the users, and wants the same sign-in if members get access later.

Rejected: removing Clerk and hosting email and password ourselves. That would throw away the account system the owner wants to keep for a later member login.

## 2026-10-11 — Attendance is a manual list for now

Superseded 2026-10-14: who adds the list is management, and the list is now the batch roster. See "Attendance shows the whole batch" below. It is still not generated from a timetable.

The coach adds people to attendance at the session, for example during warm-up. The app does not generate that list from a weekly timetable in this version.

Why: the owner said adding people is manual for now, and automation comes later.

Rejected: building enrollment rosters from a weekday schedule in this version. That automation was explicitly deferred.

## 2026-10-11 — One management role

This version has one role: management. No coach login and no member login. Management marks attendance and records fees. Public sign-up stays blocked.

Why: the owner said to assume only the management view for now.

Rejected: a coach login that can mark attendance but cannot see fees. That split is deferred. The access rule in `AGENTS.md` still applies if a coach role is added later.

## 2026-10-14 — Frontend is a static shell; data comes from server functions

The owner asked for static generation with API calls. The page shell is built as static files. Each screen loads its data once through a server function. Hovering a tab does not fetch.

Why: fewer repeated calls, and the screens no longer re-render on the server for each visit.

Rejected: keeping per-request server rendering and only trimming the duplicate calls.

## 2026-10-14 — Attendance shows the whole batch

Each batch list shows every active member and student for that batch. Neither button is selected until someone is marked. Tapping the selected button clears the mark. Someone inactive appears only if already marked that day.

Why: the owner said marking everyone in a list is faster than searching for them.

Rejected: an empty session that management searches to add people.

## 2026-10-14 — No sign-in for now

Superseded 2026-10-18: see "Sign in with Clerk restored; route-level and API protection" below.

The owner said to drop Clerk for now and finish the app. The Clerk provider is bypassed, so there is no login. This supersedes "Sign in with Clerk" above. Sign-in must be restored before real data is entered. Clerk can come back when it is time.

## 2026-10-14 — Money changes are appended, never edited

A fee correction is a new row that keeps the amount it replaced. A payment that fully covers a month freezes that month at its amount, so a later rate change does not move it. A reversal is a new row that points at the payment, and a payment can be reversed once.

Why: the owner's rule is that payments are append-only, and a rate change never rewrites a settled month.

## 2026-10-11 — Leave is corrected when management finds out

People can stop coming without notice. The monthly fee still appears. The settle list shows who has not been marked present, and that hint does not change the amount. Missing days do not remove the fee.

When management decides the person was inactive for that month, that month's new fee comes off. Earlier unpaid amounts stay. When management decides a student only came a few days, that month's fee comes off and a visit charge is added for each day they came, at the guest amount, which can be edited. The app must not choose between those, and must not count days.

If they already paid, the payment stays. The correction is on the charge. Extra money lowers the next suggested total. Once management knows the person has stopped, they set the person inactive so later months do not suggest a new fee. Until then, later months still suggest the normal fee.

Why: the owner said people go inactive without informing, and accepted this handling on 2026-10-11.

Rejected: a switch that has to be set before they leave. Also rejected: the app counting absences and changing the fee. A wrong cutoff would post a wrong balance.

## 2026-10-11 — Strict component decomposition (< 300 lines) and URL state with nuqs

All component and route files are strictly under 300 lines of code. Complex views are decomposed into focused subcomponents (e.g. `day-scroller.tsx`, `attendee-card.tsx`, `add-guest-modal.tsx`, `settle-row.tsx`, `settle-modal.tsx`, `settle-summary.tsx`, `fee-action-card.tsx`, `ledger-table.tsx`, `sport-pricing-card.tsx`).

All interactive query state (month stepper, day scroller, batch/sport/status filters, search bars) is synchronized with URL search parameters using `nuqs`, making mobile views bookmarkable and refresh-resilient without global state bloat.

## 2026-10-18 — Settle page: one row per person, payment in a popup

The settle page shows one row per person: name, the amount owed, and one button. The button reads "Receive payment", or "Enter amount" when this month's amount is missing. It opens a popup with the breakdown (earlier months, this month, visits, already paid), the amount received, how it was paid (Cash, UPI, or Other as three buttons), and a link to the full ledger. Money rules are unchanged. The amount received can be partial, and a missing month's amount is typed before a payment.

Earlier unpaid money still shows in red on the row. The "no attendance marked this month" hint is still shown and still does not change an amount.

Why: the owner said the settle page was hard to follow, and older users cannot read it easily. The old card showed the breakdown, two forms, and a payment dropdown all at once. The attendance page is the simpler model: one line per person and one clear action.

Rejected: making the existing inline forms smaller. Every field would still be on screen at once. Also rejected: a separate page per person, because it adds a screen to go back from.

## 2026-10-18 — Installable web app with an offline page; no cached data

Roll Book can be installed to a phone's home screen. The app has a manifest, icons, and a service worker. With no connection it shows a plain offline page. The service worker stores only the app's code files (the hashed `/assets/` files) and the install files. It never stores a page or a server call. Pages are rendered by the server with live attendance and payments, so a stored copy would show old marks or balances as if they were current.

Marks and payments still need the internet. There is no offline marking and no queue yet.

Why: the owner asked for an app that can be installed and opened from the home screen. Correct marks and balances matter more than offline viewing, so the service worker is limited to code and the offline page.

## 2026-10-18 — Sign in with Clerk restored; route-level and API protection

Clerk authentication is enabled across the application. The root route runs an auth check before child loaders execute, redirecting unauthenticated users to `/sign-in`. The catch-all `/sign-in/$` route renders Clerk's `<SignIn />` component inside the mobile shell without the bottom navigation bar. Server functions enforce authentication via `requireAuth()`. The mobile header displays the user button with account management and sign-out controls. The PWA setup remains intact: manifest and code assets are precached, API calls go to the network, and the offline fallback page is served when disconnected.

Why: unauthenticated users could previously access records, mark attendance, and change finances directly. Restoring Clerk secures the product without disrupting mobile navigation or PWA installability.

Rejected: client-only UI hiding without server-side verification in server functions.

## 2026-10-18 — Single Cloudflare Worker deployment with Cloudflare D1 database

Roll Book is deployed as a single Cloudflare Worker backed by a Cloudflare D1 SQLite database (`rollbook-db`) using the `wrangler` CLI.

The database driver in `src/db/index.ts` uses a runtime proxy that detects Cloudflare Worker environment bindings (`env.DB`), falling back to `bun:sqlite` during testing and local development. All server functions and database operations use asynchronous queries (`await`) to match D1's Promise-based query execution while remaining completely compatible with SQLite in tests. Static assets, PWA manifest, icons, service worker (`/sw.js`), and the fallback offline page (`/offline.html`) are served through Cloudflare's Assets binding (`ASSETS`). Clerk credentials are configured via worker environment variables (`VITE_CLERK_PUBLISHABLE_KEY`) and Cloudflare secret storage (`CLERK_SECRET_KEY`).

Why: the owner requested deployment on Cloudflare with a single worker and a D1 database. D1 provides transactional SQLite semantics in the APAC region with zero infrastructure maintenance, while Cloudflare Workers serves both dynamic SSR/API routes and static PWA assets without multi-service coordination.

Rejected: separating static hosting from API workers, or using an external hosted database over TCP/HTTP. A single worker with attached D1 keeps latency minimal, configuration unified in `wrangler.jsonc`, and operational complexity at the lowest level that holds.



