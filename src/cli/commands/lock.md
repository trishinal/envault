# `envault lock` — Vault Locking

The `lock` command lets you manually lock or unlock the vault and check its lock status. A locked vault displays a warning and prevents commands from running until explicitly unlocked.

## Subcommands

### `envault lock on`

Locks the vault by creating a `.envault.lock` file in the current directory.

```bash
envault lock on
# Vault locked successfully.
```

### `envault lock off`

Unlocks the vault by removing the `.envault.lock` file.

```bash
envault lock off
# Vault unlocked successfully.
```

### `envault lock status`

Shows whether the vault is currently locked and when it was locked.

```bash
envault lock status
# Vault is LOCKED (since 2024-06-01T12:00:00.000Z, pid 12345)
# — or —
# Vault is UNLOCKED.
```

## Lock File

The lock file (`.envault.lock`) is stored in the same directory as the vault. It contains:

```json
{
  "lockedAt": "2024-06-01T12:00:00.000Z",
  "pid": 12345
}
```

> **Tip:** Add `.envault.lock` to your `.gitignore` to avoid accidentally committing it.

## Integration with Other Commands

Other commands (e.g. `get`, `set`, `export`) respect the lock state and will exit with an error if the vault is locked.
