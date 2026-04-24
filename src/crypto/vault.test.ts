import { encrypt, decrypt, deriveKey } from './vault';
import * as crypto from 'crypto';

describe('vault crypto', () => {
  const password = 'super-secret-password';
  const plaintext = JSON.stringify({ API_KEY: 'abc123', DB_URL: 'postgres://localhost/mydb' });

  describe('deriveKey', () => {
    it('produces a 32-byte key', () => {
      const salt = crypto.randomBytes(16);
      const key = deriveKey(password, salt);
      expect(key.length).toBe(32);
    });

    it('produces the same key for the same inputs', () => {
      const salt = crypto.randomBytes(16);
      const key1 = deriveKey(password, salt);
      const key2 = deriveKey(password, salt);
      expect(key1.equals(key2)).toBe(true);
    });

    it('produces different keys for different salts', () => {
      const key1 = deriveKey(password, crypto.randomBytes(16));
      const key2 = deriveKey(password, crypto.randomBytes(16));
      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('encrypt / decrypt', () => {
    it('round-trips plaintext correctly', () => {
      const ciphertext = encrypt(plaintext, password);
      const result = decrypt(ciphertext, password);
      expect(result).toBe(plaintext);
    });

    it('produces different ciphertext each call (random IV/salt)', () => {
      const c1 = encrypt(plaintext, password);
      const c2 = encrypt(plaintext, password);
      expect(c1).not.toBe(c2);
    });

    it('throws on wrong password', () => {
      const ciphertext = encrypt(plaintext, password);
      expect(() => decrypt(ciphertext, 'wrong-password')).toThrow();
    });

    it('throws on tampered ciphertext', () => {
      const ciphertext = encrypt(plaintext, password);
      const buf = Buffer.from(ciphertext, 'base64');
      buf[buf.length - 1] ^= 0xff;
      expect(() => decrypt(buf.toString('base64'), password)).toThrow();
    });
  });
});
