# How the academy works

Settled by the owner on 2026-10-11.

## People

Everyone who trains or plays is a member. Category is a field on that person, not a separate record.

- **Member:** plays regularly, and does not need training. Charged a monthly amount, not per visit.
- **Student:** needs training. A coach is responsible for them. Monthly by default.
- **Guest player:** charged once per visit. A second visit in the same month is a second charge. Not on the monthly settle list.

A person can play more than one game. Games are configuration, not a fixed list. Two games have no calculated total. Management types that amount.

The fields to store are: name, game, type, batch, contact number, and address. Batch means morning, evening, or both. It is a field on the person. It does not generate an attendance list in this version.

No date of birth, photo, or school. Do not add them.

A member or student can stop coming without saying so. Management finds out only after they have been away for several days. See Fees for how that month is corrected.

## Who signs in

This version has one role: management. Management marks attendance and records fees. No coach login and no member login. There is no sign-in yet. See `decisions.md`.

## Attendance

The first version replaces the attendance sheet and the fee notebook together.

Each session lists the active members and students of that batch. Management marks each one present or absent. A person who has not been marked has no mark. That is not the same as absent. Guests are added to one session only. The list is not built from a weekly timetable. See `decisions.md`.

The app does not change a fee because someone was absent. Someone not added to a session has no mark. That is not the same as absent.

On the settle list, show who has not been marked present. That is a hint so management can notice someone may have left. The hint must not change an amount.

## Fees

Each month the app lists every member and regular student who still needs to settle, with the amount from settings. Management can change one person's amount for that month before settling. That change does not become the new rate.

Settle saves the amount actually paid. The month is done only when that covers what is owed. A smaller payment stays in the log, and the rest is included in the next month's suggested total. Someone who is settled leaves the needs-to-settle list. The log still shows it.

If they are not settled, the next month highlights the unpaid amount and suggests the unpaid amount plus the new month's amount. Unpaid amount is not written off.

Settings store a member cost and a student cost per game, and a guest amount per visit per game. Tennis costs more than badminton. Raising a cost updates every unsettled suggestion that uses that type and game, including the current month if it is not settled. A settled month keeps the amount that was settled. A hand-typed amount for two games is not overwritten. Nothing about a price is hardcoded.

The app must not invent a "slightly higher" formula for two games. See `decisions.md`.

Students are monthly by default. If a student is only attending for a short spell, they are not charged the monthly fee. Each visit is a charge, the same way a guest is charged. Two days and five days were examples, not a cutoff. The app must not count days and switch the fee itself.

A month is a calendar month in the academy's timezone. The amount owed for that month exists even if nobody has settled it yet, so the next month can highlight it.

A member or student can be set inactive. Later months then do not suggest a new fee. Until that is set, later months still suggest the normal fee. Inactive does not forgive money already owed.

People often leave without notice. The monthly fee still appears. When management decides the person was inactive for that month, that month's new fee comes off. Earlier unpaid amounts stay. When management decides a student only came a few days, that month's fee comes off and a visit charge is added for each day they came, at the guest amount, which can be edited. The app must not choose between those, and must not count days. See `decisions.md`.

If they already paid, the payment stays. The correction is on the charge. If that leaves extra money, the next suggested total is lower by that extra.

A recorded payment is not edited. If money received was entered wrong, the fix is a reversal. The amount used, and any correction to it, stays in that person's log.
