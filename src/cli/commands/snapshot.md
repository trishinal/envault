# `envault snapshot` — Vault Snapshots

Save and restore named snapshots of your vault at any point in time.

## Commands

### `envault snapshot save <label>`

Save the current vault state as a named snapshot. You will be prompted for your vault password to verify access before saving.

```bash
envault snapshot save before-deploy
```

### `envault snapshot restore <label>`

Restore the vault to a previously saved snapshot. The snapshot is re-encrypted with your current password.

```bash
envault snapshot restore before-deploy
```

### `envault snapshot list`

List all saved snapshots for the current vault.

```bash
envault snapshot list
```

Example output:

```
before-deploy
v1-stable
local-dev
```

### `envault snapshot delete <label>`

Permanently delete a named snapshot.

```bash
envault snapshot delete before-deploy
```

## Storage

Snapshots are stored in a `.snapshots/` directory inside your vault directory. Each snapshot is a fully encrypted vault file, identical in format to the main vault.

```
.envault/
  vault.enc
  .snapshots/
    before-deploy.vault
    v1-stable.vault
```

## Notes

- Snapshots are encrypted with the same password used at save time.
- When restoring, you must provide the correct password for the snapshot.
- Snapshot labels are sanitized: special characters are replaced with `_`.
- Snapshots are **not** automatically created — use them deliberately before risky changes.
