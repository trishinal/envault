import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { encryptVault } from '../../crypto/index.js';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-stats-test-'));
}

const VAULT_FILE = '.envault';

async function makeVault(dir: string, password: string, entries: Record<string, string>): Promise<void> {
  const encrypted = await encryptVault(entries, password);
  fs.writeFileSync(path.join(dir, VAULT_FILE), encrypted, 'utf-8');
}

describe('stats command', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('prints stats for a vault with entries', async () => {
    await makeVault(tmpDir, 'secret', {
      DATABASE_URL: 'postgres://localhost/db',
      API_KEY: 'abc123',
      SHORT: 'x',
    });

    const { registerStats } = await import('./stats.js');
    const { Command } = await import('commander');

    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const rl = { question: vi.fn((_: string, cb: (a: string) => void) => cb('secret')), close: vi.fn() };
    vi.spyOn(await import('readline'), 'createInterface').mockReturnValue(rl as any);

    const program = new Command();
    registerStats(program);
    await program.parseAsync(['node', 'envault', 'stats']);

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Total entries    : 3');
    expect(output).toContain('Longest key');
    expect(output).toContain('Shortest key');
  });

  it('exits if no vault exists', async () => {
    const { registerStats } = await import('./stats.js');
    const { Command } = await import('commander');

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const program = new Command();
    registerStats(program);
    await program.parseAsync(['node', 'envault', 'stats']);

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No vault found'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
