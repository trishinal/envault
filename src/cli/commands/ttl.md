# `envault ttl` — Time-To-Live for Vault Entries

The `ttl` command lets you attach an expiry time to individual vault entries.
Once a TTL expires, the entry can be automatically pruned from the vault.

## Subcommands

### `envault ttl set <key> <seconds>`

Sets a TTL on a key. The entry will be considered expired after `<seconds>` seconds.

```bash
envault ttl set API_TOKEN 3600   # expires in 1 hour
```

### `envault ttl get <key>`

Shows the remaining TTL for a key in seconds.

```bash
envault ttl get API_TOKEN
# API_TOKEN expires in 3542s
```

If no TTL is set, a message is shown. If the TTL has already passed, the entry
is reported as expired.

### `envault ttl prune`

Removes all expired entries from the vault and clears their TTL records.
Requires the vault password.

```bash
envault ttl prune
# Pruned 2 expired key(s): API_TOKEN, TEMP_SECRET
```

## TTL Storage

TTLs are stored in a `.ttl.json` file alongside the vault file. This file is
not encrypted but contains only key names and epoch timestamps — no secret
values. Add `.ttl.json` to your `.gitignore` if desired.

## Notes

- TTLs are advisory: expired entries remain in the vault until `prune` is run.
- Use `envault expire` for per-entry expiry with richer metadata.
- The vault must be unlocked before running `set` or `prune`.
