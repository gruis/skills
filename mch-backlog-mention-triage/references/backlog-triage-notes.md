# Backlog Triage Notes

## Notification reasons

Backlog notification `reason` values are useful hints but should not be treated
as final action classification. Always read the issue comments and status before
deciding whether Caleb needs to respond.

## Common MCH judgments

- A mention asking Caleb to review a sheet, confirm contents, or provide
  technical comments is action-needed.
- A completed ticket where Caleb is thanked or told access/permissions are
  sufficient is FYI.
- A mention addressed primarily to another MCH member is usually FYI unless it
  asks Caleb to check something specific.
- Infrastructure design tickets may ask Caleb to reply while mentioning an
  external reviewer such as iret 草薙. Preserve that instruction in the summary.
- For spec review threads from `docs/upstream/2026-05-24-backlog-spec-review-plan.md`,
  compare comments after Caleb's latest comment before saying there are new
  additions.

## Useful output buckets

- Needs your response
- Light action / sanity check
- FYI / no action
- Assigned to you
- New after your last comment
- Box-linked tickets

## Box correlation notes

- Backlog comments often link Appirits Box files as
  `https://appirits.box.com/s/<slug>`.
- Prefer an exact `sharedLink.url` slug match over a fuzzy title match.
- Report both permission metadata and practical content access:
  - metadata found
  - preview available
  - extracted text/markdown available
  - raw binary download only if an actual download tool/path was used
- For Excel workbooks, extracted content can expose sheet/tab names and enough
  nearby text to confirm the ticket is pointing at the requested sheet.
- If multiple Box results have similar names, use folder path, modified time,
  creator, and shared-link slug to disambiguate.
