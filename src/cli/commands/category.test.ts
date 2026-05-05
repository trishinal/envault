import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  setCategoryForKey,
  getCategoryForKey,
  removeCategoryForKey,
  getKeysByCategory,
  listCategories,
  renameCategoryKey,
} from '../../vault/category-hooks';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-category-test-'));
}

describe('category-hooks', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty map when no categories file exists', () => {
    const cats = listCategories(tmpDir);
    expect(cats).toEqual([]);
  });

  it('sets and gets a category for a key', () => {
    setCategoryForKey(tmpDir, 'API_KEY', 'secrets');
    expect(getCategoryForKey(tmpDir, 'API_KEY')).toBe('secrets');
  });

  it('returns undefined for key with no category', () => {
    expect(getCategoryForKey(tmpDir, 'MISSING')).toBeUndefined();
  });

  it('removes a category from a key', () => {
    setCategoryForKey(tmpDir, 'API_KEY', 'secrets');
    removeCategoryForKey(tmpDir, 'API_KEY');
    expect(getCategoryForKey(tmpDir, 'API_KEY')).toBeUndefined();
  });

  it('lists all unique categories sorted', () => {
    setCategoryForKey(tmpDir, 'DB_URL', 'database');
    setCategoryForKey(tmpDir, 'DB_PASS', 'database');
    setCategoryForKey(tmpDir, 'API_KEY', 'secrets');
    const cats = listCategories(tmpDir);
    expect(cats).toEqual(['database', 'secrets']);
  });

  it('gets keys by category', () => {
    setCategoryForKey(tmpDir, 'DB_URL', 'database');
    setCategoryForKey(tmpDir, 'DB_PASS', 'database');
    setCategoryForKey(tmpDir, 'API_KEY', 'secrets');
    const keys = getKeysByCategory(tmpDir, 'database');
    expect(keys.sort()).toEqual(['DB_PASS', 'DB_URL']);
  });

  it('returns empty array for unknown category', () => {
    expect(getKeysByCategory(tmpDir, 'nonexistent')).toEqual([]);
  });

  it('renames a category key', () => {
    setCategoryForKey(tmpDir, 'OLD_KEY', 'infra');
    renameCategoryKey(tmpDir, 'OLD_KEY', 'NEW_KEY');
    expect(getCategoryForKey(tmpDir, 'NEW_KEY')).toBe('infra');
    expect(getCategoryForKey(tmpDir, 'OLD_KEY')).toBeUndefined();
  });

  it('does nothing when renaming a non-existent key', () => {
    renameCategoryKey(tmpDir, 'GHOST', 'NEW_GHOST');
    expect(getCategoryForKey(tmpDir, 'NEW_GHOST')).toBeUndefined();
  });
});
