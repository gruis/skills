# Codex Skills

Personal Codex skills for recurring Gruis/MCH workflows.

Each top-level directory is one Codex skill and should contain a `SKILL.md`.
Optional resources live inside that skill folder, usually under `scripts/`,
`references/`, `assets/`, or `agents/`.

## Skills

| Skill | Purpose |
| --- | --- |
| `mch-backlog-mention-triage` | Read-only Appirits Backlog triage for assigned MCH tickets, mentions, notifications, and unanswered comments. |
| `mch-backlog-spec-review` | MCH/Appirits Backlog spec-review workflow for upstream Japanese Excel specs and bilingual review responses. |
| `photo-flow-lab-deploy` | Photo Flow / MedAHA lab image deployment workflow, including image tag lookup, deploy artifact updates, rollout, and verification. |
| `photo-flow-prod-backup-status` | Read-only inspection of Photo Flow / MedAHA production backup progress and completed backup artifacts. |

## Install

Codex discovers personal skills from `~/.codex/skills`. To install or refresh a
skill from this repo:

```bash
mkdir -p ~/.codex/skills
cp -R mch-backlog-mention-triage ~/.codex/skills/
```

To refresh every skill from a clean checkout:

```bash
mkdir -p ~/.codex/skills
for skill in */SKILL.md; do
  dir="${skill%/SKILL.md}"
  rm -rf "$HOME/.codex/skills/$dir"
  cp -R "$dir" "$HOME/.codex/skills/"
done
```

## Syncing Back

When a skill is edited in `~/.codex/skills`, copy the changed skill directory
back into this repo, review the diff, then commit and push:

```bash
cp -R ~/.codex/skills/<skill-name> ./
git diff -- <skill-name>
git add <skill-name>
git commit -m "Update <skill-name> skill"
git push
```

Do not commit credentials, environment files, ticket snapshots, generated test
outputs, or other local runtime artifacts. Use `/private/tmp` for scratch output.
