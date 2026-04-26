import { Command } from 'commander';
import * as readline from 'readline';
import { decryptVault } from '../../crypto/index.js';
import { getVaultPath, vaultExists } from '../../vault/store.js';
import { listEntries } from '../../vault/entries.js';
import * as fs from 'fs';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function registerStats(program: Command): void {
  program
    .command('stats')
    .description('Show statistics about the vault entries')
    .action(async () => {
      if (!vaultExists()) {
        console.error('No vault found. Run `envault init` first.');
        process.exit(1);
      }

      const password = await promptPassword('Enter vault password: ');
      const vaultPath = getVaultPath();

      let vault: Record<string, string>;
      try {
        const raw = fs.readFileSync(vaultPath, 'utf-8');
        vault = await decryptVault(raw, password);
      } catch {
        console.error('Failed to decrypt vault. Wrong password?');
        process.exit(1);
      }

      const entries = listEntries(vault);
      const totalEntries = entries.length;
      const totalValueBytes = entries.reduce((sum, [, v]) => sum + Buffer.byteLength(v, 'utf-8'), 0);
      const avgValueLen = totalEntries > 0 ? (totalValueBytes / totalEntries).toFixed(1) : '0';
      const longestKey = entries.reduce((max, [k]) => k.length > max.length ? k : max, '');
      const shortestKey = entries.reduce((min, [k]) => k.length < min.length ? k : min, entries[0]?.[0] ?? '');
      const fileStat = fs.statSync(vaultPath);

      console.log('\nVault Statistics');
      console.log('─────────────────────────────');
      console.log(`Total entries    : ${totalEntries}`);
      console.log(`Vault file size  : ${formatBytes(fileStat.size)}`);
      console.log(`Total value size : ${formatBytes(totalValueBytes)}`);
      console.log(`Avg value length : ${avgValueLen} chars`);
      if (totalEntries > 0) {
        console.log(`Longest key      : ${longestKey} (${longestKey.length} chars)`);
        console.log(`Shortest key     : ${shortestKey} (${shortestKey.length} chars)`);
      }
      console.log('');
    });
}
