# `envault search <pattern>`

Search for vault entries whose keys match a given pattern (case-insensitive substring match).

## Usage

```bash
envault search <pattern>
```

## Arguments

| Argument  | Description                              |
|-----------|------------------------------------------|
| `pattern` | Substring to search for in entry keys    |

## Example

```bash
$ envault search DB
Enter vault password: ****
Found 2 matching entries:
  DATABASE_URL
  DB_HOST
```

## Notes

- The search is **case-insensitive** and matches any part of the key name.
- Only **key names** are searched — values are never displayed by this command.
- The vault password is required to decrypt and list keys.
- If no entries match, a friendly message is shown and the command exits successfully.

## Related Commands

- [`envault list`](../list.ts) — List all keys in the vault.
- [`envault get <key>`](../get.ts) — Retrieve the value of a specific key.
