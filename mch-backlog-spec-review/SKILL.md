---
name: mch-backlog-spec-review
description: Use when reviewing MCH/Appirits Backlog tickets tied to upstream Excel specs, especially Shopify/search/MedAHA architecture reviews that need canonical Japanese workbook references, bilingual Japanese-first draft comments, Backlog API posting, assignee notification, and date-indexed tracking.
---

# MCH Backlog Spec Review

Use this skill for recurring MCH/Appirits spec-review work in Backlog. It is
designed for reviews of upstream Japanese Excel specifications, with English
translations used only as drafting aids.

## Core Rules

- Treat Japanese workbooks in `docs/upstream/JA/` as canonical.
- Use English translations in `docs/upstream/EN/` only to draft and cross-check.
- Reference canonical workbook names and specific Japanese sheet/tab names in
  comments whenever possible.
- Draft comments Japanese first, English second.
- Use heading `## 日本語 (機械翻訳)` followed by `## English` unless the user asks
  for a different format.
- Do not post to Backlog until the user has reviewed the draft, unless they
  explicitly say to post.
- After posting, notify the relevant Appirits user through the API and assign
  the ticket back to them if requested or appropriate.
- Keep a date-indexed working plan in the repo and add posted comment links.
- Never commit or print secrets from `~/.config/backlog.env`.

## Default Workflow

1. Locate ticket set:
   - Use Backlog API if credentials are available.
   - Filter by assignee, due date, parent issue, or explicit ticket ids.
   - Save fetched ticket JSON to `/private/tmp/` for the session.
2. Bucket tickets:
   - Holistic architecture/API contracts.
   - Data-shape and webhook/storage contracts.
   - Search adapter / ETL / backend APIs.
   - UI screen specs.
   - Sample data / setup follow-ons.
3. Inspect specs:
   - Prefer canonical Japanese workbook and sheet names.
   - Extract only needed tabs/rows.
   - Capture exact quotes for strong claims or surprising findings.
4. Draft responses:
   - Create date-indexed draft files, e.g.
     `docs/upstream/backlog-response-drafts/YYYY-MM-DD/MCH-###.md`.
   - Put Japanese first and English second.
   - Keep tone calm: blocker/caveat, not blame.
   - Distinguish user-facing behavior from internal logging/operations details.
5. Review loop:
   - Show the draft file link to the user.
   - Incorporate user corrections in both Japanese and English sections.
   - Do not post until the user approves.
6. Post:
   - Use Backlog API with `BACKLOG_API_KEY` from `~/.config/backlog.env`.
   - Include `notifiedUserId[]` when notifying an Appirits user.
   - Assign the issue back to the relevant Appirits user when appropriate.
   - Capture the posted comment id and link.
7. Track:
   - Update the plan checklist.
   - Add the posted comment link under the ticket.
   - Record parked follow-ups explicitly.

## Architecture Review Guardrails

When reviewing Shopify/search/MedAHA specs, watch for contracts being blurred:

- Shopify native webhook payloads.
- Shopify product/master data model, including products, variants, media,
  metafields, and metaobjects.
- MedAHA Sync publication payloads or pull APIs.
- AdvantageSearch/Search ETL JSON or object-store index documents.
- Search adapter read APIs and runtime storefront product data.

Do not accidentally approve a spec that assumes Shopify webhooks emit arbitrary
MedAHA/AS-shaped JSON. Shopify webhook subscriptions can include configured
metafields, but payloads remain Shopify-native plus configured fields. If AS
needs AS-shaped documents from Shopify-native data, the mapping belongs in the
Search ETL layer unless MedAHA Sync is explicitly publishing that projection.

Read `references/current-architecture-position.md` when the task asks for
source-of-truth, Shopify, AS, Search ETL, or holistic architecture feedback.
Read `references/backlog-api-notes.md` when posting or assigning tickets.

## Comment Style

- Be direct but non-accusatory.
- Use “please clarify/specify/document” for gaps.
- Use “not approvable as-is” only for material contract or architecture issues.
- Separate:
  - what the UI should show users,
  - what logs/alerts/support should know,
  - what API/data contracts must guarantee.
- Avoid exposing internal implementation names in user-facing text unless the
  spec itself is an internal operations/API spec.

## Useful Local Paths

- Plan files: `docs/upstream/YYYY-MM-DD-backlog-spec-review-plan.md`
- Drafts: `docs/upstream/backlog-response-drafts/YYYY-MM-DD/`
- Canonical specs: `docs/upstream/JA/`
- English drafting aids: `docs/upstream/EN/`
- Session ticket snapshots: `/private/tmp/backlog-YYYY-MM-DD-review.json`
