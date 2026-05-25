# Backlog API Notes

Credentials are expected in `~/.config/backlog.env`:

```sh
BACKLOG_API_KEY=...
```

Do not print the key or copy it into repo files.

## Known User IDs

- Appirits 安部: `1074349891`
- Appirits 石川: `1074674603`

## Posting Pattern

Use the API key from the env file and post the reviewed draft body. Example
shape:

```sh
/bin/zsh -f -lc 'set -a; source ~/.config/backlog.env; set +a; curl -s -X POST "https://appirits.backlog.jp/api/v2/issues/MCH-###/comments?apiKey=${BACKLOG_API_KEY}" --data-urlencode "content@docs/upstream/backlog-response-drafts/YYYY-MM-DD/MCH-###.md" --data "notifiedUserId[]=1074349891"'
```

Assign back when appropriate:

```sh
/bin/zsh -f -lc 'set -a; source ~/.config/backlog.env; set +a; curl -s -X PATCH "https://appirits.backlog.jp/api/v2/issues/MCH-###?apiKey=${BACKLOG_API_KEY}" --data "assigneeId=1074349891"'
```

Prefer exact posted comment links:

```text
https://appirits.backlog.jp/view/MCH-123#comment-1234567890
```

## Mention Caveat

The API notification works through `notifiedUserId[]`. Plain text `@Appirits
安部` in the comment body may not render as a true mention. If the user cares
about visible mention formatting, warn them that manual editing may still be
needed.
