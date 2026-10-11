# Decisions

## 2026-10-11 — Web version before the installable app

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

Use Clerk. The academy creates the users and gives them access. Public sign-up is blocked.

Why: the owner will create the users, and wants the same sign-in if members get access later.

Rejected: removing Clerk and hosting email and password ourselves. That would throw away the account system the owner wants to keep for a later member login.

## 2026-10-11 — Attendance is a manual list for now

Partly superseded 2026-10-11: who adds the list. See "One management role" below. The list is still manual, and it is still not generated from a timetable.

The coach adds people to attendance at the session, for example during warm-up. The app does not generate that list from a weekly timetable in this version.

Why: the owner said adding people is manual for now, and automation comes later.

Rejected: building enrollment rosters from a weekday schedule in this version. That automation was explicitly deferred.

## 2026-10-11 — One management role

This version has one role: management. No coach login and no member login. Management marks attendance and records fees. Public sign-up stays blocked.

Why: the owner said to assume only the management view for now.

Rejected: a coach login that can mark attendance but cannot see fees. That split is deferred. The access rule in `AGENTS.md` still applies if a coach role is added later.

## 2026-10-11 — Leave is corrected when management finds out

People can stop coming without notice. The monthly fee still appears. The settle list shows who has not been marked present, and that hint does not change the amount. Missing days do not remove the fee.

When management decides the person was inactive for that month, that month's new fee comes off. Earlier unpaid amounts stay. When management decides a student only came a few days, that month's fee comes off and a visit charge is added for each day they came, at the guest amount, which can be edited. The app must not choose between those, and must not count days.

If they already paid, the payment stays. The correction is on the charge. Extra money lowers the next suggested total. Once management knows the person has stopped, they set the person inactive so later months do not suggest a new fee. Until then, later months still suggest the normal fee.

Why: the owner said people go inactive without informing, and accepted this handling on 2026-10-11.

Rejected: a switch that has to be set before they leave. Also rejected: the app counting absences and changing the fee. A wrong cutoff would post a wrong balance.
