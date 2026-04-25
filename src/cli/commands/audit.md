# `envault audit`

The `audit` command inspects all entries in your vault and reports common issues that may indicate security risks or configuration mistakes.

## Usage

```bash
envault audit
```

You will be prompted for your vault password. The command then decrypts the vault and analyzes each entry.

## Checks Performed

| Check | Description |
|---|---|
| **Empty value** | The entry has no value set. |
| **Value too short** | The value is fewer than 8 characters. |
| **Weak sensitive value** | Keys containing `password`, `secret`, or `key` have values shorter than 16 characters. |
| **Lowercase key** | Convention is to use `UPPER_SNAKE_CASE` for environment variable names. |

## Example Output

```
⚠️  Found issues in 2 entry/entries:

  db_password
    - key is not uppercase
    - sensitive key has weak value (< 16 chars)

  EMPTY_TOKEN
    - empty value
```

If no issues are found:

```
✅ No issues found in vault entries.
```

## Notes

- The audit is **read-only** — it does not modify the vault.
- Use `envault rotate` to re-encrypt the vault with a new password if you suspect it has been compromised.
- Combine with `envault list` to review all current entries.
