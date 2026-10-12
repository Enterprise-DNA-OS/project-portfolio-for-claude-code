---
description: Rehearse and import a Celoxis task CSV
---

# import

Rehearse and import a Celoxis task CSV. Read CLAUDE.md first.

Run `npm run portfolio -- import celoxis --project="Warehouse renewal" --file=examples/celoxis-tasks.csv --actor=Aroha --dry-run --json`. Replace example values with the operator's records; never run example writes against their database.

Read the relevant records first. Names match without case; partial IDs work. If ambiguous, show the candidates and wait for a choice. Present dates, currency and missing evidence plainly. Never invent facts or send a message.

Use the operator's actor name for attribution. Show the intended changes before applying them. Run `help` for fields. Preserve the original baseline and the history.
