import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { generateShareToken, getShareDir, getSharePath } from './share';
import { initVault } from '../../vault/store';
import { setEntry } from '../../vault/entries';
import { encryptVault, decryptVault } from '../../crypto/index';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-share-'));
}

describe('generateShareToken', () => {
  it('returns a 32-character hex string', () => {
    const token = generateShareToken();
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it('generates unique tokens each call', () => {
    const a = generateShareToken();
    const b = generateShareToken();
    expect(a).not.toBe(b);
  });
});

describe('getShareDir / getSharePath', () => {
  it('returns correct share directory', () => {
    const dir = getShareDir('/my/vault');
    expect(dir).toBe('/my/vault/.shares');
  });

  it('returns correct share file path', () => {
    const p = getSharePath('/my/vault', 'abc123');
    expect(p).toBe('/my/vault/.shares/abc123.share');
  });
});

describe('share encryption round-trip', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = makeTempDir();
    await initVault(tmpDir, 'vault-pass');
    await setEntry(tmpDir, 'vault-pass', 'API_KEY', 'secret-value');
    await setEntry(tmpDir, 'vault-pass', 'DB_URL', 'postgres://localhost/db');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('re-encrypts entries with share password and can be decrypted', async () => {
    const sharePassword = 'share-pass-123';
    const entries = [
      { key: 'API_KEY', value: 'secret-value' },
      { key: 'DB_URL', value: 'postgres://localhost/db' },
    ];

    const shareContent = await encryptVault(entries, sharePassword);
    expect(typeof shareContent).toBe('string');
    expect(shareContent.length).toBeGreaterThan(0);

    const decrypted = await decryptVault(shareContent, sharePassword);
    expect(decrypted).toHaveLength(2);
    expect(decrypted.find((e: { key: string }) => e.key === 'API_KEY')).toBeDefined();
    expect(decrypted.find((e: { key: string }) => e.key === 'DB_URL')).toBeDefined();
  });

  it('fails to decrypt share with wrong password', async () => {
    const entries = [{ key: 'API_KEY', value: 'secret-value' }];
    const shareContent = await encryptVault(entries, 'correct-pass');
    await expect(decryptVault(shareContent, 'wrong-pass')).rejects.toThrow();
  });
});
