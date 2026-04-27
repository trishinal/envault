# `envault template` Command

Render a template file by substituting `{{ KEY }}` placeholders with values from the vault.

## Usage

```bash
envault template <templateFile> <outputFile> [options]
```

## Arguments

| Argument       | Description                          |
|----------------|--------------------------------------|
| `templateFile` | Path to the input template file      |
| `outputFile`   | Path where rendered output is saved  |

## Options

| Option            | Description                        | Default       |
|-------------------|------------------------------------|---------------|
| `-d, --dir <dir>` | Directory containing the vault     | `process.cwd()` |

## Placeholder Syntax

Use `{{ KEY }}` in your template files. Whitespace around the key name is ignored.

```
DB_HOST={{ DB_HOST }}
DB_PORT={{ DB_PORT }}
API_KEY={{ API_KEY }}
```

## Example

Given a vault with entries `DB_HOST=localhost` and `DB_PORT=5432`:

```bash
envault template config.template.env .env
```

Input `config.template.env`:
```
DB_HOST={{ DB_HOST }}
DB_PORT={{ DB_PORT }}
```

Output `.env`:
```
DB_HOST=localhost
DB_PORT=5432
```

## Notes

- Placeholders that do not match any vault entry are left unchanged in the output.
- The vault password will be prompted securely at runtime.
- Useful for generating config files, `.env` files, or deployment manifests from a shared vault.
