---
name: photo-flow-prod-backup-status
description: Inspect Photo Flow / MedAHA production backup progress and completion from the prod app host without interrupting a running backup.
---

# Photo Flow Prod Backup Status

Use this skill when asked to check the status of a production backup, explain
which phase it is in, verify that it completed, or inspect the uploaded backup
artifacts. This workflow is read-only by default.

## Guardrails

- Do not kill, restart, remove, or rerun a backup container unless the project
  owner explicitly asks.
- Do not restart shared prod services while inspecting backup state.
- Do not print secrets or dump env files.
- Prefer `ssh medaha-gcp-app` for backup inspection because the app host has
  Docker context and GCS tooling available.
- If SSH or cloud commands fail because of sandbox or network restrictions,
  rerun the same command with escalation.

## Quick Status

Check for active or recent backup containers:

```bash
ssh medaha-gcp-app "docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' | grep -i backup || true"
```

If a backup container is still running, tail its logs:

```bash
ssh medaha-gcp-app "docker logs --tail 180 <backup-container-name>"
```

Optionally sample runtime stats:

```bash
ssh medaha-gcp-app "docker stats --no-stream <backup-container-name>"
```

## Interpreting Phases

The current app backup can spend a long time in two file phases:

- Source mirror/download phase: logs reference the source URI such as
  `gs://medaha-media/directus/assets` and local staging under
  `/tmp/medaha-backups/...`.
- Upload phase: logs reference copying from the local staged files tree to the
  backup destination under `gs://medaha-backup/prod/...`.

When the container disappears and was started with `--rm`, verify completion
from the bucket instead of relying on `docker ps -a`.

## Verify Completion

Use the timestamp from logs or prior status output. Production app backups use
this destination shape:

```text
gs://medaha-backup/prod/YYYY/MM/DD/TIMESTAMP
```

List the completed prefix:

```bash
ssh medaha-gcp-app "gsutil ls -lh gs://medaha-backup/prod/YYYY/MM/DD/TIMESTAMP/"
```

Read the manifest:

```bash
ssh medaha-gcp-app "gsutil cat gs://medaha-backup/prod/YYYY/MM/DD/TIMESTAMP/manifest.json"
```

Summarize file bytes and count uploaded file objects:

```bash
ssh medaha-gcp-app "gsutil du -s gs://medaha-backup/prod/YYYY/MM/DD/TIMESTAMP/files"
ssh medaha-gcp-app "gsutil ls gs://medaha-backup/prod/YYYY/MM/DD/TIMESTAMP/files/** | wc -l"
```

For the 2026-05-21 production backup, the completed prefix was:

```text
gs://medaha-backup/prod/2026/05/21/20260521T045510Z
```

It contained `postgres.dump`, `SHA256SUMS`, `manifest.json`, and a `files/`
tree sourced from `gs://medaha-media/directus/assets`.

## Reporting

Report:

- whether a container is still running
- the latest visible phase or completion state
- the destination prefix
- manifest timestamp and source URI
- database dump presence
- file tree byte total and object count when available

Mention any uncertainty clearly, especially if the user is also watching a
manual terminal that may have more recent logs than the host retains.
