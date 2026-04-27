# `clone` Command

The `clone` command copies an existing vault to a new location, optionally re-encrypting it with a different password.

## Usage

```bash
envault clone <source> <destination> [--new-password]
```

## Arguments

| Argument      | Description                              |
|---------------|------------------------------------------|
| `source`      | Path to the source `.vault` file         |
| `destination` | Path where the cloned vault will be saved |

## Options

| Option           | Description                                         |
|------------------|-----------------------------------------------------|
| `--new-password` | Prompt for a new password for the cloned vault      |

## Examples

### Clone with the same password

```bash
envault clone ~/.envault/project.vault ~/backups/project-clone.vault
```

You will be prompted for the source vault password. The clone will use the same password.

### Clone with a new password

```bash
envault clone ~/.envault/project.vault ~/shared/project.vault --new-password
```

You will be prompted for the source password, then asked to enter and confirm a new password for the destination vault.

## Notes

- The destination path must not already exist.
- Parent directories for the destination will be created automatically.
- All entries are preserved exactly as-is during cloning.
- This is useful for sharing a vault with a colleague using a different shared password.
