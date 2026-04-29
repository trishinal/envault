# `envault expire` — Entry Expiry / TTL

The `expire` command lets you attach a time-to-live (TTL) to individual vault
entries. Once an entry's timestamp passes, it is considered **expired** and can
be purged automatically.

## Subcommands

### `envault expire set <key> <duration>`

Set an expiry on a vault entry. Duration format: `<number><unit>`.

| Unit | Meaning |
|------|---------|
| `s`  | seconds |
| `m`  | minutes |
| `h`  | hours   |
| `d`  | days    |

```bash
# Expire API_KEY in 7 days
envault expire set API_KEY 7d

# Expire SESSION_TOKEN in 2 hours
envault expire set SESSION_TOKEN 2h
```

Expiry metadata is stored in `.expire` inside the vault directory and is **not**
part of the encrypted vault itself.

---

### `envault expire check`

List all vault entries alongside their expiry status. Requires your vault
password to decrypt the entry list.

```bash
envault expire check
# Password: ****
#   API_KEY        expires 2025-09-01T12:00:00.000Z
#   SESSION_TOKEN  EXPIRED at 2025-07-15T08:00:00.000Z
#   DB_PASSWORD    (no expiry)
```

---

### `envault expire purge`

Remove all expired entries from the vault permanently. This re-encrypts the
vault without the expired keys and clears their TTL records.

```bash
envault expire purge
# Password: ****
# Purged 2 expired entry/entries.
```

> ⚠️ Purged entries cannot be recovered unless you have a backup.
> Use `envault backup create` before purging if needed.

---

## Notes

- Expiry data lives in `<vault-dir>/.expire` (plain JSON) and should be added
  to `.gitignore` if you commit the vault directory.
- Expiry is advisory — entries remain accessible until `purge` is run.
- Combine with `envault watch` or a cron job to auto-purge on a schedule.
