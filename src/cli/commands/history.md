# `envault history`

Display a log of recent vault operations such as `set`, `delete`, `rename`, and `rotate`.

## Usage

```bash
envault history [options]
```

## Options

| Option | Description | Default |
|---|---|---|
| `-n, --limit <number>` | Number of history entries to display | `20` |
| `-k, --key <key>` | Filter entries by a specific key name | — |
| `-d, --dir <path>` | Path to the vault directory | `cwd` |

## Examples

### Show last 20 operations

```bash
envault history
```

### Show last 50 operations

```bash
envault history --limit 50
```

### Filter by key name

```bash
envault history --key DATABASE_URL
```

## Output

```
Vault History (last 3 entries):

  2024-06-01T12:00:00Z  set       DATABASE_URL
  2024-06-01T11:45:00Z  delete    OLD_SECRET
  2024-06-01T11:30:00Z  rename    API_KEY
```

## Notes

- History is stored in `.envault_history.json` alongside the vault file.
- The file is **not encrypted** — avoid storing sensitive values in key names.
- A maximum of **500** entries are retained; older entries are automatically pruned.
- The vault password is verified before displaying history.
