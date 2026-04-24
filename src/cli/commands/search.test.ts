import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { initVault } from '../../vault/store';
import { setEntry } from '../../vault/entries';
import { encryptVault } from '../../crypto';
import { searchCommand } from './search';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-search-test-'));
}

async function makeVault(dir: string, password: string, entries: Record<string, string>) {
  initVault(dir);
  let vault: Record<string, string> = {};
  for (const [key, value] of Object.entries(entries)) {
    vault = setEntry(vault, key, value);
  }
  const encrypted = await encryptVault(vault, password);
  fs.writeFileSync(path.join(dir, '.envault'), encrypted, 'utf-8');
}

describe('searchCommand', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('finds matching keys by partial pattern', async () => {
    await makeVault(tmpDir, 'secret', { DATABASE_URL: 'postgres://...', DB_HOST: 'localhost', API_KEY: 'abc123' });
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(require('./search'), 'promptPassword').mockResolvedValue('secret');

    await searchCommand('DB', tmpDir);

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('DATABASE_URL');
    expect(output).toContain('DB_HOST');
    expect(output).not.toContain('API_KEY');
  });

  it('prints message when no matches found', async () => {
    await makeVault(tmpDir, 'secret', { API_KEY: 'abc123' });
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(require('./search'), 'promptPassword').mockResolvedValue('secret');

    await searchCommand('NOMATCH', tmpDir);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No entries found'));
  });

  it('exits with error when no vault exists', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(searchCommand('KEY', tmpDir)).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No vault found'));
  });
});
