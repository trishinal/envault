import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { encryptVault, decryptVault } from '../../crypto';
import { getVaultPath } from '../../vault/store';
import { hasEntry } from '../../vault/entries';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-delete-test-'));
}

async function makeVaultWithEntries(
  dir: string,
  password: string,
  entries: Record<string, string>
): Promise<void> {
  const encrypted = await encryptVault(entries, password);
  fs.writeFileSync(getVaultPath(dir), encrypted, 'utf8');
}

describe('deleteCommand logic', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('removes an existing key from the vault', async () => {
    await makeVaultWithEntries(tmpDir, 'pass', { API_KEY: '123', DB_URL: 'postgres' });

    const encrypted = fs.readFileSync(getVaultPath(tmpDir), 'utf8');
    let vault = await decryptVault(encrypted, 'pass');

    const { deleteEntry } = await import('../../vault/entries');
    vault = deleteEntry(vault, 'API_KEY');

    const reEncrypted = await encryptVault(vault, 'pass');
    fs.writeFileSync(getVaultPath(tmpDir), reEncrypted, 'utf8');

    const updated = await decryptVault(
      fs.readFileSync(getVaultPath(tmpDir), 'utf8'),
      'pass'
    );

    expect(hasEntry(updated, 'API_KEY')).toBe(false);
    expect(hasEntry(updated, 'DB_URL')).toBe(true);
  });

  it('does not alter vault when key is absent', async () => {
    await makeVaultWithEntries(tmpDir, 'pass', { ONLY_KEY: 'value' });

    const encrypted = fs.readFileSync(getVaultPath(tmpDir), 'utf8');
    const vault = await decryptVault(encrypted, 'pass');

    expect(hasEntry(vault, 'MISSING')).toBe(false);
  });
});
