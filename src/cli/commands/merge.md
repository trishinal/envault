# `envault merge` — Merge Vault Entries

The `merge` command allows you to combine entries from a **source vault** into your **current vault**, with configurable conflict resolution strategies.

## Usage

```bash
envault merge <source-vault-path> [--strategy <strategy>]
```

## Options

| Option | Description | Default |
|---|---|---|
| `--strategy` | How to handle key conflicts: `ours`, `theirs`, or `interactive` | `interactive` |

## Strategies

### `ours`
Keeps the current vault's value when a key exists in both vaults.

```bash
envault merge ./backup.vault --strategy ours
```

### `theirs`
Overwrites the current vault's value with the source vault's value on conflict.

```bash
envault merge ./colleague.vault --strategy theirs
```

### `interactive` (default)
Prompts you to choose which value to keep for each conflicting key.

```bash
envault merge ./staging.vault
```

## Notes

- You will be prompted for **both** vault passwords separately.
- Non-conflicting keys from the source are always added to the current vault.
- The merge result is saved back to the **current vault** only; the source vault is not modified.
- Use `envault backup` before merging to preserve the original state.
