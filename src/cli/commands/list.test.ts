import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { encryptVault } from '../../crypto';
import { getVaultPath } from '../../vault/store';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-list-test-'));
}

async function makeVaultWithEntries(
  dir: string,
  password: string,
  entries: Record<string, string>
): Promise<void> {
  const encrypted = await encryptVault(entries, password);
  fs.writeFileSync(getVaultPath(dir), encrypted, 'utf8');
}

describe('listCommand', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('lists keys from a vault with entries', async () => {
    await makeVaultWithEntries(tmpDir, 'secret', { FOO: 'bar', BAZ: 'qux' });

    const { decryptVault } = await import('../../crypto');
    const encrypted = fs.readFileSync(getVaultPath(tmpDir), 'utf8');
    const vault = await decryptVault(encrypted, 'secret');

    const { listEntries } = await import('../../vault/entries');
    const keys = listEntries(vault);

    expect(keys).toContain('FOO');
    expect(keys).toContain('BAZ');
    expect(keys.length).toBe(2);
  });

  it('returns empty array for empty vault', async () => {
    await makeVaultWithEntries(tmpDir, 'secret', {});

    const { decryptVault } = await import('../../crypto');
    const encrypted = fs.readFileSync(getVaultPath(tmpDir), 'utf8');
    const vault = await decryptVault(encrypted, 'secret');

    const { listEntries } = await import('../../vault/entries');
    const keys = listEntries(vault);

    expect(keys).toEqual([]);
  });
});
