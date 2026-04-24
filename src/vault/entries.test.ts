import {
  setEntry,
  getEntry,
  deleteEntry,
  listEntries,
  hasEntry,
  mergeEntries,
} from './entries';
import { initVault, VaultData } from './store';

function makeVault(entries: Record<string, string> = {}): VaultData {
  const v = initVault();
  v.entries = entries;
  return v;
}

describe('vault entries', () => {
  test('setEntry adds a new key', () => {
    const vault = makeVault();
    const updated = setEntry(vault, 'DB_URL', 'postgres://localhost');
    expect(updated.entries['DB_URL']).toBe('postgres://localhost');
  });

  test('setEntry rejects invalid keys', () => {
    const vault = makeVault();
    expect(() => setEntry(vault, 'invalid key!', 'value')).toThrow(/Invalid key/);
    expect(() => setEntry(vault, '123START', 'value')).toThrow(/Invalid key/);
  });

  test('getEntry returns value for existing key', () => {
    const vault = makeVault({ SECRET: 'abc' });
    expect(getEntry(vault, 'SECRET')).toBe('abc');
  });

  test('getEntry returns undefined for missing key', () => {
    const vault = makeVault();
    expect(getEntry(vault, 'MISSING')).toBeUndefined();
  });

  test('deleteEntry removes a key', () => {
    const vault = makeVault({ TO_DELETE: 'bye', KEEP: 'yes' });
    const updated = deleteEntry(vault, 'TO_DELETE');
    expect(updated.entries['TO_DELETE']).toBeUndefined();
    expect(updated.entries['KEEP']).toBe('yes');
  });

  test('listEntries returns all key-value pairs', () => {
    const vault = makeVault({ A: '1', B: '2' });
    const list = listEntries(vault);
    expect(list).toHaveLength(2);
    expect(list).toContainEqual({ key: 'A', value: '1' });
  });

  test('hasEntry returns correct boolean', () => {
    const vault = makeVault({ EXISTS: 'yes' });
    expect(hasEntry(vault, 'EXISTS')).toBe(true);
    expect(hasEntry(vault, 'NOPE')).toBe(false);
  });

  test('mergeEntries does not overwrite by default', () => {
    const vault = makeVault({ KEY: 'original' });
    const merged = mergeEntries(vault, { KEY: 'new', OTHER: 'added' });
    expect(merged.entries['KEY']).toBe('original');
    expect(merged.entries['OTHER']).toBe('added');
  });

  test('mergeEntries overwrites when flag is true', () => {
    const vault = makeVault({ KEY: 'original' });
    const merged = mergeEntries(vault, { KEY: 'new' }, true);
    expect(merged.entries['KEY']).toBe('new');
  });
});
