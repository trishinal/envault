import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getVaultPath,
  vaultExists,
  initVault,
  saveVault,
  loadVault,
} from './store';

const PASSPHRASE = 'test-passphrase-123';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-test-'));
}

describe('vault store', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('getVaultPath returns correct path', () => {
    expect(getVaultPath(tmpDir)).toBe(path.join(tmpDir, '.envault'));
  });

  test('vaultExists returns false when no vault', () => {
    expect(vaultExists(tmpDir)).toBe(false);
  });

  test('initVault returns empty vault with correct shape', () => {
    const vault = initVault();
    expect(vault.version).toBe(1);
    expect(vault.entries).toEqual({});
    expect(vault.createdAt).toBeDefined();
    expect(vault.updatedAt).toBeDefined();
  });

  test('saveVault and loadVault round-trip', async () => {
    const vault = initVault();
    vault.entries['API_KEY'] = 'super-secret';
    await saveVault(vault, PASSPHRASE, tmpDir);
    expect(vaultExists(tmpDir)).toBe(true);
    const loaded = await loadVault(PASSPHRASE, tmpDir);
    expect(loaded.entries['API_KEY']).toBe('super-secret');
    expect(loaded.version).toBe(1);
  });

  test('loadVault throws with wrong passphrase', async () => {
    const vault = initVault();
    await saveVault(vault, PASSPHRASE, tmpDir);
    await expect(loadVault('wrong-passphrase', tmpDir)).rejects.toThrow();
  });

  test('loadVault throws when vault does not exist', async () => {
    await expect(loadVault(PASSPHRASE, tmpDir)).rejects.toThrow(
      /No vault found/
    );
  });
});
