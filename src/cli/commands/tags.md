# `envault tags` — Entry Tag Management

The `tags` subcommand lets you attach arbitrary string labels (tags) to vault entries.
Tags are stored alongside the entry value inside the encrypted vault and can be used
for filtering, grouping, or documentation purposes.

## Subcommands

### `envault tags add <key> <tag>`

Adds a tag to the specified entry. If the tag already exists it is not duplicated.

```bash
envault tags add DB_URL infra
envault tags add DB_URL db
```

### `envault tags remove <key> <tag>`

Removes a tag from the specified entry. Safe to call even if the tag does not exist.

```bash
envault tags remove DB_URL infra
```

### `envault tags list <key>`

Prints all tags currently attached to an entry.

```bash
envault tags list DB_URL
# Tags for "DB_URL": db, infra
```

## Storage Format

Tags are stored as a plain string array on the entry object inside the vault JSON
before encryption:

```json
{
  "entries": {
    "DB_URL": {
      "value": "postgres://localhost/mydb",
      "tags": ["db", "infra"]
    }
  }
}
```

Because the vault is fully re-encrypted on every write, tags benefit from the same
AES-256-GCM encryption and PBKDF2 key derivation as all other vault data.
