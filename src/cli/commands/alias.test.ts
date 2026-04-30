import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getAliasFilePath, readAliases, writeAliases, resolveAlias } from './alias';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-alias-'));
}

describe('alias module', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty object when no alias file exists', () => {
    const aliases = readAliases(tmpDir);
    expect(aliases).toEqual({});
  });

  it('writes and reads aliases correctly', () => {
    writeAliases(tmpDir, { mydb: 'DATABASE_URL', mykey: 'API_KEY' });
    const aliases = readAliases(tmpDir);
    expect(aliases).toEqual({ mydb: 'DATABASE_URL', mykey: 'API_KEY' });
  });

  it('getAliasFilePath returns correct path', () => {
    const filePath = getAliasFilePath(tmpDir);
    expect(filePath).toBe(path.join(tmpDir, '.aliases.json'));
  });

  it('resolveAlias returns the mapped key', () => {
    writeAliases(tmpDir, { db: 'DATABASE_URL' });
    expect(resolveAlias(tmpDir, 'db')).toBe('DATABASE_URL');
  });

  it('resolveAlias returns original key if no alias found', () => {
    writeAliases(tmpDir, {});
    expect(resolveAlias(tmpDir, 'UNKNOWN_KEY')).toBe('UNKNOWN_KEY');
  });

  it('overwrites existing alias', () => {
    writeAliases(tmpDir, { db: 'OLD_DB_URL' });
    const aliases = readAliases(tmpDir);
    aliases['db'] = 'NEW_DB_URL';
    writeAliases(tmpDir, aliases);
    expect(readAliases(tmpDir)['db']).toBe('NEW_DB_URL');
  });

  it('removes an alias correctly', () => {
    writeAliases(tmpDir, { db: 'DATABASE_URL', key: 'API_KEY' });
    const aliases = readAliases(tmpDir);
    delete aliases['db'];
    writeAliases(tmpDir, aliases);
    const updated = readAliases(tmpDir);
    expect('db' in updated).toBe(false);
    expect(updated['key']).toBe('API_KEY');
  });

  it('handles corrupted alias file gracefully', () => {
    fs.writeFileSync(getAliasFilePath(tmpDir), 'not-valid-json', 'utf-8');
    expect(readAliases(tmpDir)).toEqual({});
  });
});
