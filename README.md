# envault

> A CLI tool for securely managing and syncing environment variables across dev environments using encrypted local vaults.

---

## Installation

```bash
npm install -g envault
```

Or with pnpm:

```bash
pnpm add -g envault
```

---

## Usage

Initialize a new vault in your project:

```bash
envault init
```

Add and retrieve environment variables:

```bash
# Add a secret to the vault
envault set DATABASE_URL "postgres://user:pass@localhost:5432/mydb"

# Get a secret from the vault
envault get DATABASE_URL

# List all stored keys
envault list

# Export vault contents to a .env file
envault export > .env

# Sync vault with a remote source
envault sync --remote https://vault.example.com
```

Vaults are encrypted using AES-256 and stored locally at `~/.envault/`. A master password is required on first use.

---

## Configuration

A `.envaultrc` file can be placed in your project root to define vault settings:

```json
{
  "vault": "my-project",
  "autoExport": true
}
```

---

## License

[MIT](./LICENSE) © envault contributors