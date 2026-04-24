# copy & rename commands

These two commands allow you to duplicate or move entries within an encrypted vault without exposing secrets in plaintext.

## `envault copy <SOURCE> <DEST>`

Copies the value of `SOURCE` key to a new `DEST` key. The original key is preserved.

```sh
envault copy DATABASE_URL DATABASE_URL_BACKUP
```

### Options

| Flag          | Description                                      |
|---------------|--------------------------------------------------|
| `--overwrite` | Overwrite `DEST` if it already exists            |

---

## `envault rename <SOURCE> <DEST>`

Renames `SOURCE` key to `DEST` key. The original key is removed after the operation.

```sh
envault rename OLD_API_KEY API_KEY
```

### Options

| Flag          | Description                                      |
|---------------|--------------------------------------------------|
| `--overwrite` | Overwrite `DEST` if it already exists            |

---

## Error handling

- Both commands will exit with a non-zero code if the vault does not exist.
- Both commands will exit if the source key is not found.
- Both commands will exit if the destination key already exists, unless `--overwrite` is passed.
- Decryption failures (wrong password) cause a non-zero exit.

## Security

All read/write operations go through the encrypted vault. Keys and values are never written to disk in plaintext.
