import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { initVault } from '../../vault/store';
import { setEntry } from '../../vault/entries';
import { rotateCommand } from './rotate';

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'envault-rotate-test-'));
}

describe('rotateCommand', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
    await initVault(tmpDir, 'oldpassword');
    await setEntry(tmpDir, 'oldpassword', 'KEY1', 'value1');
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('rotates the password successfully', async () => {
    const { promptPassword } = await import('./rotate');
    vi.spyOn(await import('./rotate'), 'promptPassword')
      .mockResolvedValueOnce('oldpassword')
      .mockResolvedValueOnce('newpassword')
      .mockResolvedValueOnce('newpassword');

    // Re-import to use mocked promptPassword
    const { decryptVault } = await import('../../crypto/index');
    const { getVaultPath } = await import('../../vault/store');

    await rotateCommand(tmpDir);

    const raw = await fs.readFile(getVaultPath(tmpDir), 'utf-8');
    const entries = await decryptVault(raw, 'newpassword');
    expect(entries['KEY1']).toBe('value1');
  });

  it('exits if vault does not exist', async () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });

    await expect(rotateCommand('/nonexistent/path')).rejects.toThrow('process.exit(1)');
    mockExit.mockRestore();
  });

  it('exits if passwords do not match', async () => {
    vi.spyOn(await import('./rotate'), 'promptPassword')
      .mockResolvedValueOnce('oldpassword')
      .mockResolvedValueOnce('newpassword')
      .mockResolvedValueOnce('differentpassword');

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });

    await expect(rotateCommand(tmpDir)).rejects.toThrow('process.exit(1)');
    mockExit.mockRestore();
  });
});
