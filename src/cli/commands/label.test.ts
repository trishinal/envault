import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { initVault, getVaultPath } from '../../vault/store';
import { setEntry } from '../../vault/entries';
import { encryptVault, decryptVault } from '../../crypto/index';
import {
  addLabelToKey,
  getLabelsForKey,
  getKeysByLabel,
  clearLabelsForKey,
  removeLabelFromKey,
} from '../../vault/label-hooks';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-label-cmd-'));
}

async function makeVault(dir: string, password: string) {
  const vaultPath = path.join(dir, '.envault');
  await initVault(vaultPath, password);
  return vaultPath;
}

describe('label command integration', () => {
  let dir: string;
  let vaultPath: string;
  const password = 'test-pass-label';

  beforeEach(async () => {
    dir = makeTempDir();
    vaultPath = await makeVault(dir, password);
    const entries = await decryptVault(vaultPath, password);
    entries['API_KEY'] = 'abc123';
    entries['DB_URL'] = 'postgres://localhost';
    await encryptVault(vaultPath, password, entries);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('adds and retrieves a label for a key', () => {
    addLabelToKey(dir, 'API_KEY', 'production');
    expect(getLabelsForKey(dir, 'API_KEY')).toContain('production');
  });

  it('lists keys by label', () => {
    addLabelToKey(dir, 'API_KEY', 'production');
    addLabelToKey(dir, 'DB_URL', 'production');
    const keys = getKeysByLabel(dir, 'production');
    expect(keys).toContain('API_KEY');
    expect(keys).toContain('DB_URL');
  });

  it('removes a label', () => {
    addLabelToKey(dir, 'API_KEY', 'staging');
    removeLabelFromKey(dir, 'API_KEY', 'staging');
    expect(getLabelsForKey(dir, 'API_KEY')).not.toContain('staging');
  });

  it('clears labels for a key', () => {
    addLabelToKey(dir, 'API_KEY', 'production');
    addLabelToKey(dir, 'API_KEY', 'staging');
    clearLabelsForKey(dir, 'API_KEY');
    expect(getLabelsForKey(dir, 'API_KEY')).toHaveLength(0);
  });

  it('returns empty array for unlabelled key', () => {
    expect(getLabelsForKey(dir, 'UNKNOWN_KEY')).toEqual([]);
  });

  it('returns empty array for label with no keys', () => {
    expect(getKeysByLabel(dir, 'nonexistent')).toEqual([]);
  });
});
