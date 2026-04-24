import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { initVault, getVaultPath } from '../../vault/store';
import { setEntry, getEntry } from '../../vault/entries';

const PASSWORD = 'test-password-123';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-cmd-test-'));
}

describe('set command logic', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tmpDir = makeTempDir();
    originalCwd = process.cwd();
    process.chdir(tmpDir);
    await initVault(PASSWORD);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('sets a value and retrieves it', async () => {
    await setEntry(PASSWORD, 'API_KEY', 'secret-value');
    const val = await getEntry(PASSWORD, 'API_KEY');
    expect(val).toBe('secret-value');
  });

  it('overwrites an existing value', async () => {
    await setEntry(PASSWORD, 'API_KEY', 'old-value');
    await setEntry(PASSWORD, 'API_KEY', 'new-value');
    const val = await getEntry(PASSWORD, 'API_KEY');
    expect(val).toBe('new-value');
  });

  it('returns undefined for a missing key', async () => {
    const val = await getEntry(PASSWORD, 'MISSING_KEY');
    expect(val).toBeUndefined();
  });

  it('throws on wrong password when reading', async () => {
    await setEntry(PASSWORD, 'DB_URL', 'postgres://localhost/db');
    await expect(getEntry('wrong-password', 'DB_URL')).rejects.toThrow();
  });
});
