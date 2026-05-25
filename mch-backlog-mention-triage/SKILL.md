---
name: mch-backlog-mention-triage
description: Read-only MCH/Appirits Backlog triage for Caleb's assigned issues, mentions, notifications, unanswered ticket comments, and linked Box files. Use when the user asks to check Backlog tickets, mentions, new additions after a prior comment/date, assigned work, Box-linked ticket references, or whether a mention needs action versus FYI.
---

# MCH Backlog Mention Triage

## Purpose

Use this skill to produce a concise, repeatable Backlog triage for Caleb Crane
in the Appirits `MCH` project. Keep the workflow read-only unless the user
explicitly asks to draft or post a response.

This skill answers:

- Which tickets are assigned to Caleb?
- Which tickets mention Caleb?
- Which mentions have no later Caleb response?
- Which tickets have new comments after Caleb's latest comment or after a
  requested date such as "yesterday"?
- Which items need action, and which are informational?
- Which mentioned tickets include Box links, and can those files be correlated
  to accessible Box metadata/content?

For full spec-review drafting/posting, use this skill first for triage, then use
`mch-backlog-spec-review` if the user asks to inspect specifications, draft
Japanese/English Backlog replies, post comments, or assign tickets.

## Inputs

Interpret relative dates using the current thread date/timezone. If the user
says "yesterday," convert it to an absolute date in the response.

Use the Backlog API key from `~/.config/backlog.env`. Never print the key,
write it into repo files, or include it in summaries.

## Quick Workflow

1. Run `scripts/backlog-triage.mjs` from this skill directory.
2. Save its JSON output to `/private/tmp/backlog-YYYY-MM-DD-triage.json` unless
   the user requested another path.
3. Inspect the JSON and summarize the important buckets.
4. If relevant comments contain Box links, use the Box connector to correlate
   the shared-link slug or file name to Box metadata. Confirm file id, name,
   path, permissions, and whether text/markdown extraction or preview is
   available.
5. State the fetch time, project, and any date baseline used.
6. For each mention, classify it as:
   - `Action needed`: explicit request for Caleb review/confirmation/work, or
     the ticket is assigned to Caleb and still active.
   - `Light action`: quick sanity-check/acknowledgement likely sufficient.
   - `FYI`: informational, thank-you, already complete, or superseded by a
     later response/status.
   - `No action`: ticket is complete and the mention does not request Caleb
     follow-up.

## Script Usage

```bash
node /path/to/mch-backlog-mention-triage/scripts/backlog-triage.mjs \
  --project MCH \
  --since 2026-05-24 \
  --output /private/tmp/backlog-2026-05-25-triage.json
```

Options:

- `--project`: Backlog project key. Default: `MCH`.
- `--since`: optional absolute date for "new additions after..." checks.
- `--output`: optional output path. If omitted, the script prints JSON.
- `--notification-count`: optional notification page size. Default: `100`.

The script fetches:

- current Backlog user,
- project metadata,
- issues assigned to the current user,
- issues updated since `--since` when provided,
- recent notifications,
- comments for all touched issue threads.

It computes:

- assigned issues,
- mentions of `@Caleb Crane`,
- mentions without a later Caleb-authored comment,
- comments after Caleb's latest comment per ticket,
- recent notifications grouped by issue,
- Box shared links found in comments, grouped by issue.

## Box Correlation

When a ticket comment includes a Box URL, do not ask the user to download it
first. Use the Box connector when available:

1. Extract the Box shared-link slug from comments, e.g.
   `https://appirits.box.com/s/<slug>`.
2. Search Box by the linked file title from the comment and/or by nearby
   workbook/document name.
3. Match the search result by exact `sharedLink.url` slug when possible.
4. Read file details to report file id, name, path, modified time, owner, and
   permissions such as `canPreview`, `canDownload`, and `canComment`.
5. Try file content extraction for Office/PDF/text files. If extraction works,
   summarize relevant sheet/section names. If extraction fails, report the
   metadata match and preview capability instead of claiming content access.

Mention this as a confidence signal in the triage:

```markdown
Box: matched Backlog link to `16-4-1〜7.バックエンド詳細設計.xlsx`
file id `2229472269078`; preview/content extraction available.
```

## Reporting Shape

Lead with the practical answer:

```markdown
No new comments after your 2026-05-24 replies on the review batch.

**Needs Your Response**
- MCH-374 - ...

**Light Action**
- MCH-438 - ...

**FYI / No Action**
- MCH-278 - ...
```

Keep summaries short and ticket-centered. Include Backlog links:
`https://appirits.backlog.jp/view/MCH-123`.

When the user asks what a mention is about, summarize the ask in plain English
and give a judgment. Do not paste long comments unless requested.

## Guardrails

- Do not mark notifications read.
- Do not post comments, change assignees, or update issue status.
- Do not treat unread notifications as necessarily requiring Caleb action; read
  the comment thread and ticket status.
- Do not treat every mention as an action. Thank-you comments, completed
  tickets, and comments addressed primarily to someone else are usually FYI.
- If the script cannot determine whether something was answered because the API
  page limit was reached, say so and rerun with a higher limit.
- Treat Box access as read/preview/extract unless a download-capable tool is
  explicitly available. Do not claim raw binary download unless it was actually
  performed.
