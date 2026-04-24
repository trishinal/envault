# `src/crypto` — Vault Encryption Module

This module provides AES-256-GCM authenticated encryption for envault vaults.

## How it works

1. **Key derivation** — A 256-bit key is derived from the user's master password and a random 16-byte salt using PBKDF2-SHA256 (100 000 iterations).
2. **Encryption** — AES-256-GCM encrypts the plaintext with a random 12-byte IV. The resulting auth tag (16 bytes) ensures integrity.
3. **Payload layout** — All components are concatenated and base64-encoded:

   ```
   [ salt (16) | iv (12) | tag (16) | ciphertext (n) ]  →  base64 string
   ```

4. **Decryption** — The payload is split by fixed offsets, the key is re-derived, and GCM authentication is verified before returning plaintext.

## Public API

| Export | Description |
|---|---|
| `encrypt(plaintext, password)` | Encrypt a UTF-8 string, returns base64 |
| `decrypt(ciphertext, password)` | Decrypt a base64 blob, returns UTF-8 string |
| `deriveKey(password, salt)` | Derive a 32-byte key (exposed for testing) |
| `encryptVault(record, password)` | Serialize + encrypt an env record |
| `decryptVault(ciphertext, password)` | Decrypt + deserialize an env record |

## Security notes

- Every `encrypt` call generates a fresh random salt and IV — identical plaintexts produce different ciphertexts.
- The GCM auth tag detects any tampering with the ciphertext.
- The master password is never stored; only the encrypted blob is written to disk.
