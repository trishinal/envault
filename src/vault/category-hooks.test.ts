import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getCategoryFilePath,
  readCategories,
  setCategoryForKey,
  getCategoryForKey,
  clearCategoryForKey,
  getKeysInCategory,
  listCategories,
  renameCategoryKey,
} from './category-hooks';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-category-test-'));
}

describe('category-hooks', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns empty object when no categories file exists', () => {
    expect(readCategories(dir)).toEqual({});
  });

  it('getCategoryFilePath returns correct path', () => {
    expect(getCategoryFilePath(dir)).toBe(path.join(dir, '.categories.json'));
  });

  it('sets and gets a category for a key', () => {
    setCategoryForKey(dir, 'DB_URL', 'database');
    expect(getCategoryForKey(dir, 'DB_URL')).toBe('database');
  });

  it('returns undefined for key with no category', () => {
    expect(getCategoryForKey(dir, 'MISSING_KEY')).toBeUndefined();
  });

  it('clears a category for a key', () => {
    setCategoryForKey(dir, 'API_KEY', 'auth');
    clearCategoryForKey(dir, 'API_KEY');
    expect(getCategoryForKey(dir, 'API_KEY')).toBeUndefined();
  });

  it('getKeysInCategory returns keys with matching category', () => {
    setCategoryForKey(dir, 'DB_URL', 'database');
    setCategoryForKey(dir, 'DB_PASS', 'database');
    setCategoryForKey(dir, 'API_KEY', 'auth');
    expect(getKeysInCategory(dir, 'database').sort()).toEqual(['DB_PASS', 'DB_URL']);
    expect(getKeysInCategory(dir, 'auth')).toEqual(['API_KEY']);
  });

  it('listCategories returns sorted unique categories', () => {
    setCategoryForKey(dir, 'DB_URL', 'database');
    setCategoryForKey(dir, 'API_KEY', 'auth');
    setCategoryForKey(dir, 'SECRET', 'auth');
    expect(listCategories(dir)).toEqual(['auth', 'database']);
  });

  it('renameCategoryKey moves category to new key', () => {
    setCategoryForKey(dir, 'OLD_KEY', 'network');
    renameCategoryKey(dir, 'OLD_KEY', 'NEW_KEY');
    expect(getCategoryForKey(dir, 'NEW_KEY')).toBe('network');
    expect(getCategoryForKey(dir, 'OLD_KEY')).toBeUndefined();
  });

  it('renameCategoryKey is a no-op for missing key', () => {
    renameCategoryKey(dir, 'GHOST', 'SPIRIT');
    expect(readCategories(dir)).toEqual({});
  });
});
