# `envault lint`

The `lint` command inspects all entries in your vault and reports potential issues with key naming conventions and value formatting.

## Usage

```bash
envault lint [--vault <path>]
```

## What It Checks

| Check | Description |
|-------|-------------|
| Key naming | Keys should follow `UPPER_SNAKE_CASE` convention |
| Empty values | Warns if a value is empty or contains only whitespace |
| Long values | Warns if a value exceeds 4096 characters |
| Unquoted whitespace | Warns if a value contains spaces but is not wrapped in quotes |

## Options

| Option | Description |
|--------|-------------|
| `--vault <path>` | Path to a specific vault file (defaults to `.envault`) |

## Example Output

```
Found 2 issue(s):

  api_key
    ⚠ Key should be UPPER_SNAKE_CASE

  APP_DESCRIPTION
    ⚠ Value contains whitespace but is not quoted
```

If no issues are found:

```
✔ No issues found in vault entries.
```

## Exit Codes

- `0` — No issues found
- `1` — One or more issues detected (or decryption failure)

## Notes

- The vault must be unlocked before running lint (see `envault lock`).
- Lint is non-destructive; it only reads and reports, never modifies entries.
