# `envault diff` Command

Compare two encrypted vault files and show which keys were added, removed, or changed.

## Usage

```bash
envault diff <otherVault>
```

## Arguments

| Argument     | Description                              |
|--------------|------------------------------------------|
| `otherVault` | Path to another `.vault` file to compare |

## Output Format

Each line is prefixed with a symbol indicating the diff type:

| Symbol | Meaning                                      |
|--------|----------------------------------------------|
| `+`    | Key exists in `otherVault` but not in current vault |
| `-`    | Key exists in current vault but not in `otherVault` |
| `~`    | Key exists in both vaults but values differ  |

If the vaults are identical, the message `Vaults are identical.` is printed.

## Notes

- Both vaults must be decryptable with the **same** master password.
- Only key names are shown — values are never printed to protect secrets.
- Useful for reviewing changes before a restore or merge.

## Example

```bash
envault diff ./backups/vault-2024-01-01.vault
```

```
+ NEW_API_KEY
- OLD_SECRET
~ DATABASE_URL
```
