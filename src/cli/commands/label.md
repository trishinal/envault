# `envault label` — Key Label Management

The `label` command lets you attach free-form string labels to vault keys, making it easy to group and filter entries by environment, team, or any custom taxonomy.

## Subcommands

### `envault label add <key> <label>`
Attach a label to a vault key.

```bash
envault label add API_KEY production
envault label add DB_URL production
envault label add SECRET staging
```

### `envault label remove <key> <label>`
Remove a specific label from a key.

```bash
envault label remove API_KEY production
```

### `envault label list <key>`
List all labels attached to a key.

```bash
envault label list API_KEY
# Output:
#   - production
#   - critical
```

### `envault label keys <label>`
List all keys that have a given label.

```bash
envault label keys production
# Output:
#   API_KEY
#   DB_URL
```

### `envault label clear <key>`
Remove all labels from a key.

```bash
envault label clear API_KEY
```

## Storage

Labels are stored in `.labels.json` inside the vault directory alongside the encrypted vault file. This file is not encrypted but contains only key names, not values.

## Use Cases

- Tag keys by environment (`production`, `staging`, `dev`)
- Mark sensitive keys (`pii`, `secret`, `restricted`)
- Group keys by service or team (`backend`, `frontend`, `infra`)
