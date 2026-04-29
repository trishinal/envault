# `compress` Command

The `compress` command allows you to compress and decompress your envault vault file using gzip. This is useful for reducing file size before sharing or backing up your vault.

## Subcommands

### `pack`

Compresses the vault file (`.envault`) in the current or specified directory to a `.envault.gz` file.

```bash
envault compress pack
envault compress pack --dir /path/to/project
```

**Output:** Prints the path to the compressed file.

### `unpack <file>`

Decompresses a `.envault.gz` file back into a `.envault` vault file.

```bash
envault compress unpack .envault.gz
envault compress unpack /path/to/.envault.gz --dir /path/to/project
```

**Arguments:**
- `<file>` — Path to the `.gz` compressed vault file.

**Options:**
- `--dir <dir>` — Target vault directory (default: current working directory).

## Notes

- The vault must be **unlocked** before compressing or decompressing.
- Compression does not decrypt the vault; the encrypted contents are compressed as-is.
- The original vault file is preserved after compression.
- Decompression will **overwrite** the existing `.envault` file in the target directory.

## Example Workflow

```bash
# Compress vault before sharing
envault compress pack
# → Vault compressed to: /project/.envault.gz

# Restore vault from compressed file
envault compress unpack .envault.gz
# → Vault decompressed to: /project/.envault
```
