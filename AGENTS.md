# Roll Book

Roll Book is an attendance and payment tracker for academies. More features will be added over time.

Attendance and payments are the core, so they must always be correct. A wrong attendance mark or a wrong balance is worse than a missing feature.

## Project memory (`.docs/`)

`.docs/` is the project's memory. A new agent with no prior knowledge must be able to start from it. At the start of every session, read `.docs/README.md`, then whatever it points to for the task.

Two files are fixed at the root. Everything else is yours to organize:

- `README.md`: the entry point and index. Explains what the project is in a few lines, how `.docs/` is organized, and lists every file with a one-line summary in reading order.
- `status.md`: current state, what is next, and open questions.

Create whatever files and folders the project needs (decisions, context, domain rules, architecture, research, guides, or others). Choose a structure that stays easy to navigate, and keep it consistent.

Keep it up to date automatically, without being asked, in the same change as the work that caused it. Record decisions and why they were made, what you learn about how the academy works, settled business rules, and changes in state. Update `README.md` whenever the structure changes. After recording, tell the owner in one line what you wrote and where.

- Store the core, never the conversation. Record the outcome and why, and the alternatives rejected and why. No transcripts.
- Record something only if a new agent would otherwise repeat the discussion or undo the decision.
- Don't record what the code already shows: stack, dependencies, commands, file layout.
- Update existing files instead of creating near-duplicates. Remove content that is no longer true.
- Don't rewrite an accepted decision. To change one, record a new decision that supersedes it and mark the old one.
- Write for a reader who has never seen this project: plain words, define terms, use absolute dates, and never write "as discussed".
- Never store secrets or any personal data about members.

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
