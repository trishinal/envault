import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { getVaultPath, vaultExists } from '../../vault/store';
import { decryptVault } from '../../crypto';
import { assertVaultUnlocked } from './lock-guard';

export function getTtlFilePath(vaultDir: string): string {
  return path.join(vaultDir, '.ttl.json');
}

export type TtlMap = Record<string, number>; // key -> expiry epoch ms

export function readTtl(vaultDir: string): TtlMap {
  const p = getTtlFilePath(vaultDir);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function writeTtl(vaultDir: string, ttl: TtlMap): void {
  fs.writeFileSync(getTtlFilePath(vaultDir), JSON.stringify(ttl, null, 2));
}

export function isTtlExpired(ttl: TtlMap, key: string): boolean {
  if (!(key in ttl)) return false;
  return Date.now() > ttl[key];
}

export function pruneTtl(ttl: TtlMap): string[] {
  const expired: string[] = [];
  for (const [key, exp] of Object.entries(ttl)) {
    if (Date.now() > exp) expired.push(key);
  }
  return expired;
}

function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(prompt, ans => { rl.close(); resolve(ans); }));
}

export function registerTtl(program: import('commander').Command): void {
  const cmd = program.command('ttl').description('Manage time-to-live for vault entries');

  cmd.command('set <key> <seconds>')
    .description('Set a TTL (in seconds) for a key')
    .action(async (key: string, seconds: string) => {
      assertVaultUnlocked();
      const vaultDir = process.cwd();
      if (!vaultExists(vaultDir)) { console.error('No vault found.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const vaultPath = getVaultPath(vaultDir);
      await decryptVault(fs.readFileSync(vaultPath, 'utf-8'), password);
      const ttl = readTtl(vaultDir);
      ttl[key] = Date.now() + parseInt(seconds, 10) * 1000;
      writeTtl(vaultDir, ttl);
      console.log(`TTL set for "${key}": expires in ${seconds}s`);
    });

  cmd.command('get <key>')
    .description('Show remaining TTL for a key')
    .action(async (key: string) => {
      assertVaultUnlocked();
      const vaultDir = process.cwd();
      if (!vaultExists(vaultDir)) { console.error('No vault found.'); process.exit(1); }
      const ttl = readTtl(vaultDir);
      if (!(key in ttl)) { console.log(`No TTL set for "${key}".`); return; }
      const remaining = Math.max(0, Math.floor((ttl[key] - Date.now()) / 1000));
      if (remaining === 0) console.log(`"${key}" has expired.`);
      else console.log(`"${key}" expires in ${remaining}s`);
    });

  cmd.command('prune')
    .description('Remove expired TTL entries from the vault')
    .action(async () => {
      assertVaultUnlocked();
      const vaultDir = process.cwd();
      if (!vaultExists(vaultDir)) { console.error('No vault found.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const vaultPath = getVaultPath(vaultDir);
      const raw = fs.readFileSync(vaultPath, 'utf-8');
      const entries = await decryptVault(raw, password);
      const ttl = readTtl(vaultDir);
      const expired = pruneTtl(ttl);
      if (expired.length === 0) { console.log('No expired entries.'); return; }
      for (const key of expired) {
        delete entries[key];
        delete ttl[key];
      }
      const { encryptVault } = await import('../../crypto');
      fs.writeFileSync(vaultPath, await encryptVault(entries, password));
      writeTtl(vaultDir, ttl);
      console.log(`Pruned ${expired.length} expired key(s): ${expired.join(', ')}`);
    });
}
