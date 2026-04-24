export { encrypt, decrypt, deriveKey } from './vault';

/**
 * Serialises an env record to JSON, encrypts it, and returns the base64 blob.
 */
export function encryptVault(
  envRecord: Record<string, string>,
  password: string
): string {
  const { encrypt } = require('./vault');
  const json = JSON.stringify(envRecord);
  return encrypt(json, password);
}

/**
 * Decrypts a base64 blob and deserialises it back to an env record.
 */
export function decryptVault(
  ciphertext: string,
  password: string
): Record<string, string> {
  const { decrypt } = require('./vault');
  const json = decrypt(ciphertext, password);
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Vault data is not a key-value record.');
    }
    return parsed as Record<string, string>;
  } catch {
    throw new Error('Failed to parse decrypted vault contents. Data may be corrupt.');
  }
}
