<h1 align="center">Project Portfolio for Claude Code</h1>

<p align="center">
  <strong>The open-source project portfolio that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your Celoxis data brought across.<br/><a href="https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=celoxis">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/celoxis?utm_source=github&utm_medium=readme&utm_campaign=celoxis">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#instead-of-celoxis">Instead of Celoxis</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

Project Portfolio for Claude Code holds the weekly delivery and governance records a project office uses: projects, tasks, milestones, people, commitments, costs, risks, changes, decisions and benefits. Ask a coding agent to read or update them through one CLI. There is no interactive application to maintain.

Celoxis Business publishes US$45 per standard user per month, prepaid annually. A modelled 50-standard-user team is US$27,000 a year before other services. This is a seat-cost calculation, not an observed customer invoice; contributor licences can change the mix. [Vendor pricing](https://www.celoxis.com/pricing), checked 12 October 2026.

This is a free base for an owner-led professional firm or an internal project office. It covers review and recordkeeping, not Celoxis's full scheduling engine. Enterprise DNA builds the screens, integrations and access controls needed for an operated team version through **Omni by Enterprise DNA**. One setup fee, then a retainer.

## Why no front end

- The front end was only ever there because the database was hard to talk to. That is no longer true.
- Your data sits in plain Postgres tables you own. Any tool can read them. No export, no lock-in.
- No seats, no tiers, no add-ons. Read [docs/why-no-front-end.md](docs/why-no-front-end.md) for the honest trade-offs too.

## Quick start

Start with fictional demo records. Node 20 or newer is required:

```bash
git clone https://github.com/Enterprise-DNA-OS/project-portfolio-for-claude-code.git
cd project-portfolio-for-claude-code
npm install
npm run demo
```

Then open the folder in your coding agent and ask `/attention`. Run `npm run portfolio -- help` for the CLI. For real work use a separate empty DATA_DIR and migrate only; never seed fictional records into a working database.

### Use it with your own Postgres or Supabase

Copy `.env.example` to `.env`, set `DATABASE_URL`, then `npm run migrate`. Same commands, shared data, no per-seat fee.

## The commands

| Command | What it does |
|---|---|
| `/portfolio` | Review delivery, budgets, late work and open changes |
| `/projects` | List project sponsors, cases and benefit owners |
| `/people` | List people, weekly capacity and retention dates |
| `/tasks` | Review task owners, dates and progress |
| `/milestones` | Compare milestone finishes with their original baseline |
| `/budgets` | Compare approved budgets and actual costs by currency |
| `/capacity` | Find people booked beyond their weekly capacity |
| `/risks` | Review risk scores, mitigation and next review dates |
| `/changes` | Read pending and decided changes |
| `/decisions` | Find decisions waiting on an owner |
| `/benefits` | Follow up promised outcomes and evidence |
| `/dependencies` | Find unfinished predecessors across projects |
| `/attention` | List late work, stale updates and overdue reviews |
| `/compliance` | Check retention reminders and local governance rules |
| `/history` | Read attributed changes to records |
| `/show` | Read one record by name or partial ID |
| `/add` | Add a project, task, person, allocation, expense, risk, change or decision |
| `/update` | Update a record after reading it |
| `/log` | Record a dated project note |
| `/depend` | Record a predecessor without creating a cycle |
| `/approve-change` | Approve a pending change as a second person |
| `/reject-change` | Reject a pending change with a reason |
| `/close-project` | Close only when delivery controls pass |
| `/import` | Rehearse and import a Celoxis task CSV |
| `/export` | Export all records and history to JSON |
| `/weekly-review` | Draft a review from current delivery, attention and capacity |
| `/draft-steering-pack` | Draft a steering meeting briefing from live records |
| `/draft-change-request` | Draft the current changes, budget and milestones |
| `/help` | Read syntax, record fields and commands |
| `/customise` | Change a field or rule with a tested migration |
| `/new-view` | Add a branded read-only report |

All CLI commands accept `--json`. Writes require `--actor=Name`; this is an audit label, not authentication. Name matching ignores case; partial IDs work; ambiguity lists candidates and exits 1. Drafts stay in drafts/ and nothing sends. `npm run view` produces two read-only dashboards; `npm run docs` produces steering packs, change records and closure records using brand.json.

## Ten questions your portfolio records answer

Celoxis has configurable reports too. These are tested questions over the records you own, not claims that its report builder is incapable of answering them.

1. Which projects are already over their approved budget? `budgets`
2. Who is committed to more hours than they have this week? `capacity`
3. Which milestones slipped from their original dates? `milestones`
4. Which project is waiting on unfinished work in another project? `dependencies`
5. Which open tasks have gone two weeks without an update? `attention`
6. What budget and date changes are waiting for a second person? `changes`
7. Which sponsor decisions are already overdue? `decisions`
8. Which promised benefits are due without evidence? `benefits`
9. Which risks have a high score but no recent review? `risks`
10. Which records need a retention or evidence review? `compliance`

## Your first hour: ten things to ask for

1. Put our name and logo in brand.json.
2. Create our projects with sponsors, managers and currencies.
3. Import one Celoxis plan as a test run and compare the counts.
4. Set the milestones and record the acceptance evidence.
5. Set each person's real weekly availability.
6. Add this week's project commitments and show overbooking.
7. Enter the supplier expenses and costed time.
8. Record the decisions the sponsor owes us.
9. Draft the steering pack with overdue work and risks.
10. Add our business-case field or review threshold with `/customise`.

## Instead of Celoxis

Export each project's selected Gantt columns as CSV and run:

```bash
npm run portfolio -- import celoxis --project="Warehouse renewal" --file=examples/celoxis-tasks.csv --actor=Aroha --dry-run
```

Remove `--dry-run` after checking the result. Reimports match source task IDs within a project. Original columns are retained. Dependencies, time, costs, attachments and approvals need separate reconciliation. See [the complete switching guide](docs/replace-celoxis.md) for columns, date formats and limitations. One day is a migration rehearsal, not a promise that every historic record has moved.

## Record controls

A completed milestone requires evidence. A change needs a second person's decision before its cost and finish deltas affect the approved baseline. Closing is refused while tasks, risks, changes or decisions are open. The [compliance checks](docs/compliance.md) distinguish privacy retention reminders from local governance policies. Budgets never combine currencies. Capacity uses recorded weekly commitments, not a scheduling optimizer.

## Architecture

```
project-portfolio-for-claude-code/
  CLAUDE.md                 how the operator wants this run (routing table + house rules)
  AGENTS.md                 the same, for Codex / OpenCode / Cursor / Gemini CLI
  .claude/commands/         the slash commands
  scripts/                  the CLI the commands drive
  scripts/lib/db.mjs        one adapter: DATABASE_URL (pg) or embedded PGlite
  supabase/migrations/      plain SQL schema
  supabase/seed.sql         demo data
  docs/                     the thesis and the migration guide
```

## Built for coding agents

The database, CLI and command recipes work with Claude Code, Codex, OpenCode or Cursor. Ask your coding agent for a new command and have it implement and test the change against the same records.

## Contributing

Issues and pull requests are welcome. Keep the shape: plain SQL, a small CLI, a slash command per recurring job, no front end.

## Want it installed and run for you?

Enterprise DNA installs Project Portfolio for Claude Code for your business, migrates your Celoxis data, connects it to the rest of your tools, and runs it for you as part of **Omni by Enterprise DNA**, our managed Command Centre. One setup fee, then a monthly retainer.

- Book a call: [enterprisedna.co/omni/book](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=celoxis)
- Read more: [enterprisedna.co/omni/instead-of/celoxis](https://enterprisedna.co/omni/instead-of/celoxis?utm_source=github&utm_medium=readme&utm_campaign=celoxis)

## License

MIT. Copyright (c) 2026 Enterprise DNA.
