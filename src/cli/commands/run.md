# `envault run` Command

Run any shell command with vault entries automatically injected as environment variables.

## Usage

```bash
envault run <command> [args...]
envault run --tags <tags> <command> [args...]
```

## Description

The `run` command decrypts your vault and spawns the given command with all stored
entries available as environment variables. This avoids the need to export variables
manually or maintain `.env` files on disk.

## Options

| Option | Description |
|--------|-------------|
| `-t, --tags <tags>` | Comma-separated list of tags to filter which entries are injected |

## Examples

### Inject all vault entries

```bash
envault run node server.js
```

### Inject only entries tagged `prod`

```bash
envault run --tags prod node server.js
```

### Use with npm scripts

```bash
envault run npm run dev
```

### Use with multiple tags

```bash
envault run --tags prod,shared node deploy.js
```

## Security Notes

- The vault password is prompted securely and never stored.
- Injected variables exist only in the child process environment.
- No `.env` file is written to disk.
- The parent shell environment is unaffected after the command exits.
