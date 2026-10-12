---
description: Change fields, stages or review rules in plain language
---

# Customise

Read CLAUDE.md and the relevant migration, CLI and tests. Ask the operator to describe the field, stage or rule they need. Write a new numbered migration instead of changing an applied one. Preserve existing records and history. Update the CLI allowlist, command recipe and document/view queries together. Apply to a temporary seeded database and test both the requested result and a refused invalid case. Back up the working database before applying the migration there. Run npm test. Report the changed behavior. Never send, delete, or change permissions without the operator's explicit instruction.
