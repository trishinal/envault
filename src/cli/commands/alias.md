# `envault alias` — Key Aliases

The `alias` command lets you define short, memorable names for vault keys.
Instead of typing `DATABASE_URL` every time, you can create an alias like `db`
and use it anywhere the CLI accepts a key name.

## Subcommands

### `envault alias set <alias> <key>`

Create or update an alias pointing to an existing vault key.

```bash
envault alias set db DATABASE_URL
envault alias set token STRIPE_SECRET_KEY
```

### `envault alias remove <alias>`

Delete an alias. The underlying key is not affected.

```bash
envault alias remove db
```

### `envault alias list`

Print all defined aliases and their target keys.

```bash
envault alias list
# db -> DATABASE_URL
# token -> STRIPE_SECRET_KEY
```

## Alias Resolution

Aliases are stored in `.aliases.json` inside the vault directory and are
automatically resolved by `resolveAlias()` before any vault read/write
operation that imports the helper.

## Notes

- Aliases are **not** encrypted — they only map names to key identifiers.
- Aliases do **not** store values; they reference existing keys.
- Renaming or deleting the target key does not automatically update aliases.
- The alias file is local and should be added to `.gitignore` if desired.
