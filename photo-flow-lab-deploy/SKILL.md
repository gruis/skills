---
name: photo-flow-lab-deploy
description: Operate the Photo Flow / MedAHA lab image deployment workflow. Use when Codex needs to inspect GitHub Actions Container Images runs, identify the latest GHCR image tag, update lab deploy artifacts, repair SOPS-managed env files, sync lab hosts, roll out lab server/Pick/Studio/agent services, or verify lab deployment health for /Users/caleb/src/mch/photo-flow.
---

# Photo Flow Lab Deploy

## Overview

Use this workflow for the Directus-first Photo Flow repo at `/Users/caleb/src/mch/photo-flow` when the user asks to get a recent image tag, update lab artifacts, sync lab, deploy lab, or recover from a lab image-build/deploy issue.

Keep deployment actions explicit and observable. Do not hide build, sync, or runtime errors. If a local command fails because of network or sandbox restrictions, rerun it with escalation rather than changing the workflow.

## Workflow

1. Start in the repo root and inspect status:

```bash
cd /Users/caleb/src/mch/photo-flow
git status --short
git remote -v
```

2. Find the relevant image build:

```bash
gh run list --workflow "Container Images" --branch <branch> --limit 10
gh run view <run-id> --json status,conclusion,headSha,jobs,url
gh api repos/gruis/photo-flow/actions/runs/<run-id>/artifacts
```

Prefer the newest successful `Container Images` run for the branch the user is working from. If a newer run is queued or in progress, tell the user and poll until it completes when they asked for that newer build.

3. Download image refs and manifest:

```bash
mkdir -p /tmp/photo-flow-run-<run-id>
gh run download <run-id> -n image-refs-test -D /tmp/photo-flow-run-<run-id>
gh run download <run-id> -n deploy-manifest-test -D /tmp/photo-flow-run-<run-id>
jq . /tmp/photo-flow-run-<run-id>/image-refs-test.json
jq '{generated_at, git, images: (.images | with_entries(.value |= {ref,digest,found_local})), build, validation}' /tmp/photo-flow-run-<run-id>/deploy-manifest-test.json
```

Use the artifact value as the source of truth. PR test tags usually look like `test-<branch-slug>-<sha7>`, but do not rely only on inference when artifacts exist.

4. Update lab artifacts:

The lab server and CPU agent tags live in SOPS-managed dotenv files:

```text
deploy/server/environments/lab/opt/medaha/server/.env
deploy/agent/environments/lab/cpu/.env
```

Update them with `sops --set`, not plain text editing, so the MAC remains valid:

```bash
sops --input-type dotenv --output-type dotenv --set '["IMAGE_TAG"] "<tag>"' deploy/server/environments/lab/opt/medaha/server/.env
sops --input-type dotenv --output-type dotenv --set '["IMAGE_TAG"] "<tag>"' deploy/agent/environments/lab/cpu/.env
sops -d deploy/server/environments/lab/opt/medaha/server/.env | rg -n "IMAGE_PREFIX|IMAGE_TAG"
sops -d deploy/agent/environments/lab/cpu/.env | rg -n "IMAGE_PREFIX|IMAGE_TAG"
```

If a file was edited directly and `sops -d` reports a MAC mismatch, repair it by rerunning `sops --set` with `--ignore-mac` once, then verify normal `sops -d` succeeds.

5. Commit meaningful milestones:

```bash
git add deploy/server/environments/lab/opt/medaha/server/.env deploy/agent/environments/lab/cpu/.env
git commit -m "Update lab image tag"
```

If a code fix is needed to produce a new image, commit that fix, push the branch, confirm the PR has `ci:publish-test-images`, and watch the new `Container Images` run. Use the new artifact tag before updating lab.

6. Sync lab:

```bash
./deploy/sync.sh --env lab
```

Expected targets are `caleb@directus-lab:/` for server artifacts and `caleb@pimagent-lab:/opt/medaha/lab/agent/cpu` for CPU agent artifacts. A successful sync reports `decrypt_failed=0` for server and `decrypt_ok=1` for agent.

7. Roll out lab:

```bash
./deploy/rollout.sh --env lab --yes
```

This usually runs backup, server, reconcile, and `agent-cpu`. Watch for:

- backup uploaded to `gs://medaha-backup/lab/...`
- schema apply success
- server, Pick, and Studio images on the requested tag
- `/server/health` OK
- API smoke OK
- reconcile OK: schema drift, roles, flows, access, and flow invariants
- CPU agent smoke OK

8. Verify after rollout:

```bash
./deploy/status.sh --env lab
curl -s https://lab.medaha.gru.is/server/health
```

For runtime dependency fixes, verify inside the deployed container, for example:

```bash
ssh caleb@directus-lab "docker exec medaha-server node -e \"const sharp=require('/directus/extensions/agent/node_modules/sharp'); console.log(sharp.versions.sharp)\""
```

## Guardrails

- Do not kill, restart, or replace shared local servers outside the deploy scripts unless the user explicitly asks.
- Do not bypass Caddy for user-facing verification; use `https://lab.medaha.gru.is` for final health checks.
- Do not silence logs or warnings to make a deployment look clean. Preserve evidence and fix the underlying issue.
- Treat SOPS-managed files as encrypted artifacts. Validate with `sops -d` before syncing.
- If `gh`, SSH, rsync, Docker, or curl fail due to network/sandbox restrictions, request escalation and rerun the same operational command.
- Mention orphan containers seen during rollout, but do not remove them unless the user asks.
