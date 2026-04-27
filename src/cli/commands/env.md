# `envault env` Command

Print vault entries as shell-compatible `export` statements, suitable for use with `eval` or shell scripts.

## Usage

```bash
envault env [options]
```

## Options

| Option | Description |
|--------|-------------|
| `-f, --filter <pattern>` | Only include keys whose names contain the given pattern (case-insensitive) |
| `--no-export` | Omit the `export` keyword from output lines |

## Examples

### Export all variables into current shell

```bash
eval $(envault env)
```

### Export only AWS-related variables

```bash
eval $(envault env --filter AWS)
```

### Print without `export` keyword

```bash
envault env --no-export
# Output:
# API_KEY=abc123
# DB_URL=postgres://localhost/mydb
```

## Output Format

Each line is formatted as:

```
export KEY=value
```

Values containing spaces, quotes, `#`, or backslashes are automatically wrapped in double quotes with internal quotes escaped.

## Notes

- The vault must be initialized before using this command.
- If the vault is locked (via `envault lock`), you must unlock it first.
- The password prompt is written to `stderr` to avoid polluting shell `eval` usage.
