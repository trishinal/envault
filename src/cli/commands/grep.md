# `envault grep` — Search Entry Values by Pattern

The `grep` command searches vault entries whose **values** match a given regular expression or substring pattern, similar to the Unix `grep` utility.

---

## Usage

```bash
envault grep <pattern> [options]
```

### Arguments

| Argument  | Description                              |
|-----------|------------------------------------------|
| `pattern` | Regular expression or plain text to match against entry values |

### Options

| Flag             | Description                                         |
|------------------|-----------------------------------------------------|
| `-i, --ignore-case` | Case-insensitive matching                        |
| `-k, --keys-only`   | Only print matching keys, not values             |
| `--dir <path>`      | Path to the vault directory (default: `.envault`) |

---

## Examples

### Find entries containing a URL

```bash
envault grep "https://"
```

### Case-insensitive search

```bash
envault grep -i "localhost"
```

### Print only the matching keys

```bash
envault grep --keys-only "prod"
```

---

## Output Format

Matching entries are displayed as:

```
KEY=value
```

With `--keys-only`:

```
KEY
```

---

## Notes

- Patterns are treated as JavaScript `RegExp` strings.
- Values are decrypted in memory for matching and never written to disk.
- Use `envault search` to search by **key name** instead of value.
