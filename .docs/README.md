# Roll Book

Roll Book is an attendance and payment tracker for sports academies. MS Sports Academy is the first academy that will use it. The product is not specific to that academy.

It exists because that academy tracks attendance and fees by hand. Self-hostable open-source tools were hobby projects or club tools, and did not fit batch-based sessions. Commercial tools were rejected for plan limits, data lock-in, and an uncertain fit.

Attendance and payments must stay correct. A wrong mark or a wrong balance is worse than a missing feature.

## How this folder is organized

`.docs/` is project memory for a new agent. It records how the academy works, accepted decisions, and current state. It does not copy the code, the stack, or the rules in `AGENTS.md`.

Read this file, then `status.md`, then the file that matches the task.

## Files

1. `status.md` — current state, what is next, and open questions.
2. `domain.md` — how the academy charges and marks attendance, as far as that is settled.
3. `decisions.md` — accepted decisions, with the date and why. A later decision supersedes an older one; the old one is marked, not rewritten.
4. `mockups/index.html` — static pictures of the management screens. Not the app. Names and amounts there are samples.
