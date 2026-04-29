# `envault fmt`

Sort and normalize vault entries alphabetically by key.

## Usage

```bash
envault fmt [options]
```

## Options

| Option | Description | Default |
|--------|-------------|--------|
| `-d, --dir <directory>` | Vault directory | `process.cwd()` |
| `--dry-run` | Preview sorted key order without writing | `false` |

## Description

The `fmt` command re-encrypts your vault with all entries sorted alphabetically by key. This is useful for keeping vaults consistent and diff-friendly, especially when using `envault diff` or reviewing vault exports.

If the vault is already sorted, no changes are made.

## Examples

### Sort vault in-place

```bash
envault fmt
```

You will be prompted for your vault password. If the entries are not already sorted, the vault will be re-encrypted with keys in alphabetical order.

### Preview without writing

```bash
envault fmt --dry-run
```

Prints the sorted key order to stdout without modifying the vault.

### Use a custom vault directory

```bash
envault fmt --dir /path/to/project
```

## Notes

- The `fmt` command does **not** change any values, only the order of keys.
- The vault is re-encrypted after sorting, so your password is required.
- If the vault is locked (see `envault lock`), `fmt` will refuse to run.
- Pair with `envault diff` to review changes between two formatted vaults.
