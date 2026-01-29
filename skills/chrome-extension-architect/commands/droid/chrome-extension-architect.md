---
description: Load Chrome Extension Architect skill for privacy-first MV3 extension development
argument-hint: <task description>
---

Load the Chrome Extension Architect skill and help build privacy-first Chrome Manifest V3 extensions.

## Workflow

### Step 1: Check for --update-skill flag

If $ARGUMENTS contains `--update-skill`:

1. Determine install location by checking which exists:
   - Local: `.factory/skills/chrome-extension-architect/`
   - Global: `~/.factory/skills/chrome-extension-architect/`

2. Run the appropriate install command:

   ```bash
   # For local installation
   curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --local --droid

   # For global installation
   curl -fsSL https://raw.githubusercontent.com/Alcyone-Labs/agent-skills/main/install.sh | bash -s -- --global --droid
   ```

3. Output success message and stop (do not continue to other steps).

### Step 2: Load skill

Load the chrome-extension-architect skill.

### Step 3: Identify task type

Based on the user's request, determine:
- **Browser target** (Chrome/Edge, Firefox, Safari, or cross-browser)
- **Task category** (side panel, permissions, service worker lifecycle, storage, debugging, templates)
- **Data sensitivity** (what user data is touched)

Use the decision tree in SKILL.md to select correct references.

### Step 4: Read relevant reference files

| Task | Read from references/ |
|------|----------------------|
| Side panel | `sidepanel/` |
| Permissions | `permissions/` |
| Service worker | `service-worker-lifecycle/` |
| Storage | `storage-state/` |
| Cross-browser | `cross-browser/` |
| Debugging | `debugging/` |
| Templates | `templates/` |

### Step 5: Execute

Provide expert guidance following privacy-first, least-privilege principles.

**Response Format:**

1. **Target + assumptions** (1–3 lines)
2. **Recommended architecture** (what runs where)
3. **Permissions proposal** (minimal set) + privacy warnings
4. **State & persistence plan** (storage choice) + lifecycle gotchas
5. **Code snippets** (manifest + SW + UI + messaging)
6. **Debug checklist** (what to check when it breaks)

### Step 6: Summarize

```
=== Task Complete ===
Extension type: <type>
Permissions: <list>
Key files: <list>
```

<user-request>
$ARGUMENTS
</user-request>
