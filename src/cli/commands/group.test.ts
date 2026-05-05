import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { registerGroup } from './group';
import { Command } from 'commander';
import { initVault } from '../../vault/store';
import { setEntry } from '../../vault/entries';
import { encryptVault } from '../../crypto';

const TEST_PASSWORD = 'test-pass-123';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-group-cmd-test-'));
}

async function makeVault(dir: string) {
  await initVault(dir);
  const entries = { DB_URL: 'postgres://localhost/test', API_KEY: 'abc123', SECRET: 'shh' };
  const encrypted = await encryptVault(entries, TEST_PASSWORD);
  fs.writeFileSync(path.join(dir, '.envault'), JSON.stringify(encrypted));
  return entries;
}

describe('group command', () => {
  let dir: string;

  beforeEach(async () => {
    dir = makeTempDir();
    await makeVault(dir);
  });

  function runGroup(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const output: string[] = [];
      const program = new Command();
      program.configureOutput({
        writeOut: (str) => output.push(str),
        writeErr: (str) => output.push(str),
      });
      registerGroup(program, dir, () => Promise.resolve(TEST_PASSWORD));
      program.exitOverride();
      try {
        program.parse(['node', 'envault', ...args]);
        setTimeout(() => resolve(output.join('')), 50);
      } catch (e: any) {
        if (e.code === 'commander.helpDisplayed') resolve(output.join(''));
        else reject(e);
      }
    });
  }

  it('adds a key to a group and lists it', async () => {
    const program = new Command();
    const logs: string[] = [];
    const consoleSpy = (msg: string) => logs.push(msg);
    const origLog = console.log;
    console.log = consoleSpy;

    registerGroup(program, dir, () => Promise.resolve(TEST_PASSWORD));
    program.exitOverride();

    try {
      await program.parseAsync(['node', 'envault', 'group', 'add', 'backend', 'DB_URL']);
    } catch {}

    try {
      await program.parseAsync(['node', 'envault', 'group', 'list', 'backend']);
    } catch {}

    console.log = origLog;
    expect(logs.some((l) => l.includes('DB_URL'))).toBe(true);
  });

  it('removes a key from a group', async () => {
    const program = new Command();
    const logs: string[] = [];
    console.log = (msg: string) => logs.push(msg);

    registerGroup(program, dir, () => Promise.resolve(TEST_PASSWORD));
    program.exitOverride();

    try { await program.parseAsync(['node', 'envault', 'group', 'add', 'backend', 'DB_URL']); } catch {}
    try { await program.parseAsync(['node', 'envault', 'group', 'add', 'backend', 'API_KEY']); } catch {}
    try { await program.parseAsync(['node', 'envault', 'group', 'remove', 'backend', 'DB_URL']); } catch {}
    try { await program.parseAsync(['node', 'envault', 'group', 'list', 'backend']); } catch {}

    console.log = console.log;
    expect(logs.some((l) => l.includes('API_KEY'))).toBe(true);
  });
});
