# Status

As of 2026-10-18.

## Current state

The app runs as a website. The page shell is built as static files, and each screen loads its data once through a server function.

- **Today:** one list per batch (morning, evening). It shows the members and students of that batch. Tap Present or Absent. Tap the selected one again to clear it. Someone not yet marked has no selection. Guests are added to one session by name and game. Each batch card has an Add guest button that opens a popup. The popup stays open, so several guests can be added in a row, and it lists the guests already in that session.
- **Settle:** for the chosen month, everyone who still owes money, one row each with the amount owed and one button. Receive payment (or Enter amount, when this month's amount is missing) opens a popup with the breakdown, the amount received, and how it was paid. Earlier unpaid amounts roll into the total and show in red on the row. A payment can be partial. A month fully paid is frozen at its amount.
- **People:** the roster, with active, inactive and type filters. Add a person.
- **Person:** the log (fees, corrections, visits, payments, reversals). Record a payment, correct a month, add a visit charge, reverse a payment, set active or inactive, edit details.
- **Settings:** member and student monthly rate, and guest rate per visit, for each game. Add a game. A rate change applies only to unsettled months.

Checks run on 2026-10-18: type check, Biome, 16 unit tests (`bun test`). Neither the Add guest popup nor the settle redesign has been opened in a browser yet. The test browser could not load the dev server: a framework module failed to load and the page kept reloading. Check both screens on a real phone or desktop browser.

Checks run on 2026-10-14: type check, Biome, 16 unit tests (`bun test`), and a production build that prerenders the shell. In the browser: marks stay on their own date, guest add, payment, reversal, waiver, visit charge, settled-month freeze, and call counts (one call per tab click, none on hover). Those browser checks predate the Add guest popup.

Not yet reviewed on a real phone screen.

## Known gaps

1. **No sign-in.** Clerk is bypassed by owner decision (see `decisions.md`). Anyone who can reach the server can record payments and change fees. Fix this before real money data is entered.
2. **Development database.** `dev.db` holds sample members and payments from the seed. Do not use it for real records.

## Open questions

1. **Settle hint counts absent marks.** `domain.md` says the settle list shows who has not been marked **present**. The code hides the hint when a person has any mark for the month, including absent. Also the "Marked this month" filter uses the same check. The owner needs to confirm which is right before the code changes.
