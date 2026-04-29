import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { encryptVault, decryptVault } from '../../crypto/index';
import { initVault, getVaultPath } from '../../vault/store';
import { sortEntries } from './fmt';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-fmt-'));
}

describe('sortEntries', () => {
  it('sorts keys alphabetically', () => {
    const input = { ZEBRA: '1', APPLE: '2', MANGO: '3' };
    const result = sortEntries(input);
    expect(Object.keys(result)).toEqual(['APPLE', 'MANGO', 'ZEBRA']);
  });

  it('returns same entries with values intact', () => {
    const input = { B: 'beta', A: 'alpha' };
    const result = sortEntries(input);
    expect(result['A']).toBe('alpha');
    expect(result['B']).toBe('beta');
  });

  it('handles empty object', () => {
    expect(sortEntries({})).toEqual({});
  });

  it('handles single entry', () => {
    const input = { ONLY: 'one' };
    expect(sortEntries(input)).toEqual({ ONLY: 'one' });
  });

  it('is stable for already-sorted input', () => {
    const input = { A: '1', B: '2', C: '3' };
    const result = sortEntries(input);
    expect(Object.keys(result)).toEqual(['A', 'B', 'C']);
  });
});

describe('fmt vault integration', () => {
  let tmpDir: string;
  const password = 'test-password';

  beforeEach(async () => {
    tmpDir = makeTempDir();
    await initVault(tmpDir, password);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('round-trips sorted entries through encrypt/decrypt', async () => {
    const entries = { Z: 'last', A: 'first', M: 'middle' };
    const sorted = sortEntries(entries);
    const encrypted = await encryptVault(sorted, password);
    const decrypted = await decryptVault(encrypted, password);
    expect(Object.keys(decrypted)).toEqual(['A', 'M', 'Z']);
    expect(decrypted['A']).toBe('first');
  });

  it('writes sorted vault to disk', async () => {
    const entries = { Z: 'last', A: 'first' };
    const sorted = sortEntries(entries);
    const encrypted = await encryptVault(sorted, password);
    const vaultPath = getVaultPath(tmpDir);
    fs.writeFileSync(vaultPath, encrypted, 'utf-8');
    const raw = fs.readFileSync(vaultPath, 'utf-8');
    const result = await decryptVault(raw, password);
    expect(Object.keys(result)[0]).toBe('A');
  });
});
