# Status

As of 2026-10-18.

## Current state

The app runs as a website and can be installed to a phone's home screen (a PWA). Without a connection it shows an offline page, and nothing can be marked or paid. Nothing about the data is cached (see `decisions.md`).

- **Today:** one list per batch (morning, evening). It shows the members and students of that batch. Tap Present or Absent. Tap the selected one again to clear it. Someone not yet marked has no selection. Guests are added to one session by name and game. Each batch card has an Add guest button that opens a popup. The popup stays open, so several guests can be added in a row, and it lists the guests already in that session.
- **Settle:** for the chosen month, everyone who still owes money, one row each with the amount owed and one button. Receive payment (or Enter amount, when this month's amount is missing) opens a popup with the breakdown, the amount received, and how it was paid. Earlier unpaid amounts roll into the total and show in red on the row. A payment can be partial. A month fully paid is frozen at its amount.
- **People:** the roster, with active, inactive and type filters. Add a person.
- **Person:** the log (fees, corrections, visits, payments, reversals). Record a payment, correct a month, add a visit charge, reverse a payment, set active or inactive, edit details.
- **Settings:** member and student monthly rate, and guest rate per visit, for each game. Add a game. A rate change applies only to unsettled months.

Checks run on 2026-10-18: type check (`tsc --noEmit`), Biome (`biome check`), 22 unit tests (`bun test`), and build verification (`DEPLOY_TARGET=cloudflare`). CI/CD is configured for automated deployments on push. Clerk authentication is enabled with root-level route protection and server function guards (`requireAuth`). The application runs on Cloudflare as a single Worker with an attached D1 SQLite database (`rollbook-db`). Non-mandatory fields (phone, address, custom rate) were removed from `PersonModal` to streamline mobile entry and prevent overflow, leaving only name, type, batch, and games. Not yet checked: installing to a real phone, and the offline page on a real network drop (the test browser cannot cut the network). The Add guest popup and the settle redesign have not been checked on a phone either.

Checks run on 2026-10-14: type check, Biome, 16 unit tests (`bun test`), and a production build that prerenders the shell. In the browser: marks stay on their own date, guest add, payment, reversal, waiver, visit charge, settled-month freeze, and call counts (one call per tab click, none on hover). Those browser checks predate the Add guest popup.

Not yet reviewed on a real phone screen.

## Known gaps

1. **Development database.** `dev.db` holds sample members and payments from the seed. Do not use it for real records. Production uses remote Cloudflare D1 (`rollbook-db`).
2. **Offline is only the offline page.** Marks and payments cannot be saved without a connection.
3. **Accessibility, from a Lighthouse run on 2026-10-18.** The viewport setting blocks pinch-zoom (`user-scalable=no`). Some text fails colour contrast. There is no `<main>` landmark. The zoom and contrast issues affect older users most.

## Open questions

1. **Settle hint counts absent marks.** `domain.md` says the settle list shows who has not been marked **present**. The code hides the hint when a person has any mark for the month, including absent. Also the "Marked this month" filter uses the same check. The owner needs to confirm which is right before the code changes.
2. **Offline marking.** Should attendance be recordable without a connection? That needs a queue and a decision on conflicts (see `decisions.md`, 2026-10-18).
