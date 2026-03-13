# Lightpanda Skill

Self-contained Lightpanda browser skill package.

## Exported commands

- `lightpanda-start`
- `lightpanda-stop`
- `lightpanda-fetch`
- `lightpanda-structured`
- `lightpanda-interactive`
- `lightpanda-semantic`

## Install

```bash
bash install.sh --local --dry-run
# or
agent-skills install lightpanda --local
```

## Runtime ownership

- Browser binary is provisioned to `runtime/browser/lightpanda`.
- PID/log state is stored under `runtime/state/`.
- Node dependencies are installed inside the skill directory.
