# `envault notes` — Entry Notes

Attach human-readable notes to any vault entry. Useful for documenting the purpose of a variable, rotation schedules, or ownership information.

Notes are stored in a `.notes.json` file alongside the vault and are **not** encrypted. Avoid storing sensitive information in notes.

---

## Commands

### `envault notes set <key> <note>`

Attach or update a note for an existing entry.

```bash
envault notes set API_KEY "Rotate every 30 days — contact devops"
```

---

### `envault notes get <key>`

Display the note for a specific entry.

```bash
envault notes get API_KEY
# API_KEY: Rotate every 30 days — contact devops
```

---

### `envault notes delete <key>`

Remove the note attached to an entry.

```bash
envault notes delete API_KEY
```

---

### `envault notes list`

List all entries that have notes, along with their note content.

```bash
envault notes list
# API_KEY: Rotate every 30 days — contact devops
# DB_PASS: Production only — do not share
```

---

## Notes

- Notes are stored in `.notes.json` next to the vault file.
- Notes persist across password changes and vault rotations.
- When an entry is renamed using `envault rename`, notes are automatically migrated to the new key name.
- Notes are **not** included in encrypted vault exports.
