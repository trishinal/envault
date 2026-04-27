import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { getVaultPath, vaultExists } from '../../vault/store';

const LOCK_FILE_NAME = '.envault.lock';

export function getLockFilePath(dir: string = process.cwd()): string {
  return path.join(dir, LOCK_FILE_NAME);
}

export function isVaultLocked(dir: string = process.cwd()): boolean {
  return fs.existsSync(getLockFilePath(dir));
}

export function lockVault(dir: string = process.cwd()): void {
  const lockPath = getLockFilePath(dir);
  const lockData = {
    lockedAt: new Date().toISOString(),
    pid: process.pid,
  };
  fs.writeFileSync(lockPath, JSON.stringify(lockData, null, 2), 'utf-8');
}

export function unlockVault(dir: string = process.cwd()): boolean {
  const lockPath = getLockFilePath(dir);
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
    return true;
  }
  return false;
}

export function getLockInfo(dir: string = process.cwd()): { lockedAt: string; pid: number } | null {
  const lockPath = getLockFilePath(dir);
  if (!fs.existsSync(lockPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
  } catch {
    return null;
  }
}

export function registerLock(program: Command): void {
  const lock = program.command('lock').description('Lock or unlock the vault');

  lock
    .command('on')
    .description('Lock the vault to prevent accidental access')
    .action(() => {
      if (!vaultExists()) {
        console.error('No vault found. Run `envault init` first.');
        process.exit(1);
      }
      if (isVaultLocked()) {
        console.log('Vault is already locked.');
        return;
      }
      lockVault();
      console.log('Vault locked successfully.');
    });

  lock
    .command('off')
    .description('Unlock the vault')
    .action(() => {
      if (!vaultExists()) {
        console.error('No vault found. Run `envault init` first.');
        process.exit(1);
      }
      const removed = unlockVault();
      if (removed) {
        console.log('Vault unlocked successfully.');
      } else {
        console.log('Vault is not locked.');
      }
    });

  lock
    .command('status')
    .description('Check whether the vault is currently locked')
    .action(() => {
      if (!vaultExists()) {
        console.error('No vault found. Run `envault init` first.');
        process.exit(1);
      }
      const info = getLockInfo();
      if (info) {
        console.log(`Vault is LOCKED (since ${info.lockedAt}, pid ${info.pid})`);
      } else {
        console.log('Vault is UNLOCKED.');
      }
    });
}
