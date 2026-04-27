# `envault pin` — Pin Frequently Used Keys

The `pin` command lets you mark specific vault keys as "pinned" so you can quickly list their values without scrolling through the entire vault. Pinned keys are stored in a local `.envault-pins` file in the vault directory.

## Subcommands

### `envault pin add <key>`

Pin a key for quick access. The key must exist in the vault.

```bash
envault pin add API_KEY
# Password: ****
# Pinned "API_KEY".
```

### `envault pin remove <key>`

Remove a key from the pinned list.

```bash
envault pin remove API_KEY
# Unpinned "API_KEY".
```

### `envault pin list`

List all pinned keys and their current values from the vault.

```bash
envault pin list
# Password: ****
# Pinned keys:
#   API_KEY=abc123
#   DB_URL=postgres://localhost/dev
```

## Options

| Option | Description | Default |
|--------|-------------|--------|
| `-d, --dir <dir>` | Vault directory | Current directory |

## Notes

- The `.envault-pins` file is a plain-text newline-separated list of key names. It contains **no secrets** and can safely be committed to version control if desired.
- Pinned keys that no longer exist in the vault will display `(not found)` when listed.
- The vault must be **unlocked** before using pin commands.
