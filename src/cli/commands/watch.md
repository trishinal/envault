# `envault watch`

Watch the vault file for changes and print a live summary whenever it is updated.

## Usage

```bash
envault watch [--dir <path>]
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--dir <path>` | `process.cwd()` | Directory containing the `.envault` vault file |

## Behaviour

1. Prompts for the vault password once at startup.
2. Decrypts and prints the current entry list immediately.
3. Uses `fs.watch` to monitor the `.envault` file for modifications.
4. On every detected change, re-decrypts the vault and prints an updated summary showing:
   - The time of the change.
   - The total number of entries.
   - Each key and its tags.
5. Press **Ctrl+C** to stop watching.

## Example output

```
Watching vault at /project/.envault for changes...
Press Ctrl+C to stop.

[10:42:01] Vault updated — 3 entries
  • API_KEY [prod]
  • DB_URL [prod, staging]
  • DEBUG

[10:43:17] Vault updated — 4 entries
  • API_KEY [prod]
  • DB_URL [prod, staging]
  • DEBUG
  • NEW_VAR
```

## Notes

- The vault must be **unlocked** (see `envault lock`) before watching.
- The password is only requested once; subsequent reads reuse it in memory for the session.
