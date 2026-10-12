# Record checks and their sources

Sources checked 12 October 2026. `npm run portfolio -- compliance` flags records for review; it does not certify legal compliance.

| Rule | Check | Basis |
|---|---|---|
| NZ-IPP9 | People without a recorded purpose, and people or closed projects whose retention review is missing or overdue | [NZ Privacy Commissioner, Principle 9](https://www.privacy.org.nz/privacy-principles/9/): personal information must not be retained longer than its lawful purpose requires. No fixed number of years is imposed by this check. |
| AU-APP11 | The same retention review queue, for organisations subject to the APPs | [OAIC APP 11 guidance](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information): assess destruction or de-identification when information is no longer needed, subject to Commonwealth record and legal retention exceptions. |
| INTERNAL-CASE | Active project without a business case or benefit owner | Local governance policy, not a statute |
| INTERNAL-EVIDENCE | Completed milestone with no acceptance evidence | Local acceptance policy |
| INTERNAL-RISK | Open risk without a mitigation | Local risk review policy |
| INTERNAL-RECEIPT | Expense without supporting evidence | Local cost control policy |

Change decisions require a different actor from the requester. A decision records its reason and changes the approved budget and finish once. Closing refuses unfinished tasks, open risks, pending changes and unanswered decisions, and requires benefit follow-up and retention dates. These are local controls, not claims about a named legal standard.

A legal hold suppresses the closed-project retention reminder; it does not erase anything. Person records still appear for review. Decide the lawful purpose and retention obligation for the whole record, including attachments and copies. No deletion or automatic notice is built in.

The actor field is attribution, not authenticated identity. Anyone with database-owner access can change records or audit history. This local tool does not provide enterprise access control, tamper-proof records or a compliance certification. For a shared deployment, restrict database credentials, define reader and writer roles, encrypt backups and test restoration. Rows have RLS enabled without public policies; use a dedicated trusted owner connection, never expose it to a browser.
