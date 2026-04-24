import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { encryptVault } from '../../crypto/index';
import { registerChangePassword } from './change-password';

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'envault-cp-test-'));
}

describe('change-password command', () => {
  let tmpDir: string;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
    originalEnv = process.env.ENVAULT_DIR;
    process.env.ENVAULT_DIR = tmpDir;
  });

  afterEach(async () => {
    process.env.ENVAULT_DIR = originalEnv;
    await fs.rm(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('should fail if no vault exists', async () => {
    const program = new Command();
    registerChangePassword(program);

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(program.parseAsync(['node', 'envault', 'change-password'])).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No vault found'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should fail with incorrect current password', async () => {
    const vaultPath = path.join(tmpDir, '.envault');
    const encrypted = await encryptVault({ KEY: 'value' }, 'correct-password');
    await fs.writeFile(vaultPath, encrypted, 'utf-8');

    const program = new Command();
    registerChangePassword(program);

    const prompts = ['wrong-password', 'new-password1', 'new-password1'];
    let callCount = 0;
    vi.mock('readline', () => ({
      createInterface: () => ({
        question: (_: string, cb: (a: string) => void) => cb(prompts[callCount++] ?? ''),
        close: () => {},
        _writeToOutput: null,
        output: { write: () => {} },
      }),
    }));

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(program.parseAsync(['node', 'envault', 'change-password'])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
