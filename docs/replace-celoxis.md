# Bring a Celoxis plan across

Checked 12 October 2026 against [Celoxis export instructions](https://www.celoxis.com/kb/latest/tasks/actions/exporting-tasks-to-csv). In a project's Gantt, choose More, Export, CSV. Celoxis exports the displayed columns. Include a stable task ID, name, start, finish, percent complete, work and assigned people. Set work to hours. Export each project separately. This example is a synthetic fixture built from documented selectable columns, not an account export supplied by Celoxis.

Create the destination project, then import its exported plan:

```bash
npm run portfolio -- add projects --name="Your project" --sponsor=Mere --manager=Aroha --target-finish=2027-01-31 --actor=Mere
npm run portfolio -- import celoxis --project="Your project" --file=examples/celoxis-tasks.csv --actor=Aroha --dry-run
npm run portfolio -- import celoxis --project="Your project" --file=examples/celoxis-tasks.csv --actor=Aroha
```

One import command per project. The test run validates every row and rolls back all writes, including history. Repeat imports update tasks by project and source ID; they never delete absent tasks. The original finish becomes the baseline on the first import and remains fixed on later imports. Original columns remain in source_data, including unmapped custom fields. Source owner text stays as text; it does not create capacity allocations or people.

| Export | Destination |
|---|---|
| ID or Task ID | Stable external_id within this project |
| Name or Task Name | Task name |
| Start or Start Date | Start date |
| Finish or Finish Date | Current finish; initial baseline |
| % Complete or Percent Complete | Numeric completion between zero and one hundred |
| Work, Planned Work or Planned Hours | Planned hours, numeric or hours suffix |
| Assigned To, Resources or Owner | Owner text |
| Other columns | Original source_data only |

For renamed columns use `--mapping=examples/column-mapping.json`. Use ISO dates, or specify `--date-order=dmy` or `--date-order=mdy` for slash-separated dates. Ambiguous dates, duplicate IDs, malformed CSV and work expressed in days are rejected before any write. The importer requires an explicit ID; do not treat a row number that changes on each export as a permanent identity.

Dependencies, hierarchy, resource calendars, time entries, expenses, attachments, recurring rules and approval history are not recreated by this task-plan import. Export and retain their original records separately. Add dependencies and allocations through the CLI after reconciliation. Summary task rows remain ordinary tasks; exclude roll-up rows if their work duplicates detail rows. An imported completed milestone must already have acceptance evidence recorded here. New imported tasks are not automatically classified as milestones.

Compare task count, dates, completion and total planned hours with the export. Check missing custom fields and historic evidence with the project manager. Use the free version for a one-day migration rehearsal, then agree the broader migration and cutover based on that comparison. Do not cancel the source until the records the team needs have been reconciled.
