import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getLockFilePath,
  isVaultLocked,
  lockVault,
  unlockVault,
  getLockInfo,
} from './lock';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-lock-test-'));
}

describe('lock utilities', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('getLockFilePath returns correct path', () => {
    const lockPath = getLockFilePath(tmpDir);
    expect(lockPath).toBe(path.join(tmpDir, '.envault.lock'));
  });

  it('isVaultLocked returns false when no lock file exists', () => {
    expect(isVaultLocked(tmpDir)).toBe(false);
  });

  it('lockVault creates a lock file', () => {
    lockVault(tmpDir);
    expect(fs.existsSync(getLockFilePath(tmpDir))).toBe(true);
  });

  it('isVaultLocked returns true after locking', () => {
    lockVault(tmpDir);
    expect(isVaultLocked(tmpDir)).toBe(true);
  });

  it('getLockInfo returns lock metadata', () => {
    lockVault(tmpDir);
    const info = getLockInfo(tmpDir);
    expect(info).not.toBeNull();
    expect(info?.pid).toBe(process.pid);
    expect(typeof info?.lockedAt).toBe('string');
  });

  it('unlockVault removes the lock file and returns true', () => {
    lockVault(tmpDir);
    const result = unlockVault(tmpDir);
    expect(result).toBe(true);
    expect(isVaultLocked(tmpDir)).toBe(false);
  });

  it('unlockVault returns false when vault is not locked', () => {
    const result = unlockVault(tmpDir);
    expect(result).toBe(false);
  });

  it('getLockInfo returns null when not locked', () => {
    expect(getLockInfo(tmpDir)).toBeNull();
  });
});
