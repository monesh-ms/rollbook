# Roll Book

Roll Book is an attendance and payment tracker for academies. More features will be added over time.

Attendance and payments are the core, so they must always be correct. A wrong attendance mark or a wrong balance is worse than a missing feature.

## How to work

Understand first: read the task and the code it touches, and trace the real flow before changing anything.

Then take the simplest option that holds. Stop at the first step that does:
1. Is this needed at all?
2. Does the codebase already do it? Reuse it.
3. Does the platform or an already-installed dependency cover it?
4. Write the minimum code that works.

- No abstraction, dependency, or extra file nobody asked for. Deleting beats adding.
- Fix bugs at the root: find every caller of the code you touch and fix it once, in the shared place.
- When two options are about the same size, pick the one that handles edge cases correctly.
- If you take a shortcut with a known limit, mark it with a comment naming the limit and the upgrade path.
- Non-trivial logic leaves one runnable check behind: the smallest test that fails if the logic breaks.
- If a request is bigger than it needs to be, say so and propose the smaller version.
- For real architectural decisions, compare the options with trade-offs and ask. Don't decide silently.

## Never cut corners on

- **Money:** integer minor units plus a currency code, never floats. Payments are append-only; fix mistakes with a reversal, not an edit or delete.
- **Attendance:** one mark per member per session, and writes are idempotent because clients retry and may queue offline. Session dates are the academy's local calendar date, not UTC.
- **Tenant isolation:** every tenant-owned table has `academy_id`, and every query filters by it.
- **Access:** coaches can mark attendance but cannot see payments. Enforce this in the API, not only the UI.
- **Children's data:** collect the minimum. Keep personal data out of logs, fixtures, tests, and commits.
- **Input validation** at every boundary, and anything that could lose data.

## Vocabulary

Academy (the tenant) · Batch (a recurring group slot with a coach) · Member (the person who trains) · Guardian (a member's contact) · Session (one occurrence of a batch on a date) · Plan (what is owed for a period) · Payment (money received against it)

## Reusable by other academies

Nothing specific to one academy (name, domain, currency, timezone) is hardcoded. MS Sports Academy is the first deployment, not the product.
