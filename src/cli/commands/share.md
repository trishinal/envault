# `envault share`

Export a re-encrypted vault snapshot for sharing with another developer.

## Usage

```bash
envault share [options]
```

## Options

| Flag | Description |
|------|-------------|
| `-k, --keys <keys>` | Comma-separated list of keys to include (default: all) |
| `-o, --output <file>` | Output file path (default: auto-generated in `.shares/`) |

## How it works

1. Prompts for your vault password to decrypt the vault.
2. Prompts for a **share password** — the recipient will need this to import.
3. Re-encrypts the selected entries with the share password.
4. Writes the share file to `.shares/<token>.share` (or a custom path).

## Examples

```bash
# Share all entries
envault share

# Share specific keys
envault share --keys API_KEY,DATABASE_URL

# Share to a specific file
envault share --output /tmp/my-share.share
```

## Importing a share

The recipient can import the share using:

```bash
envault import --file /path/to/share.share
```

They will be prompted for the share password.

## Security notes

- Share files are encrypted with AES-256-GCM using the share password.
- Share files should be transmitted securely (e.g. encrypted email, secure file transfer).
- The `.shares/` directory is excluded from version control by default.
- Rotate your vault password after sharing if entries have changed.
