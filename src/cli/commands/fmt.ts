import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { decryptVault, encryptVault } from '../../crypto/index';
import { getVaultPath, vaultExists } from '../../vault/store';
import { listEntries } from '../../vault/entries';
import { assertVaultUnlocked } from './lock-guard';

function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function sortEntries(entries: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(entries).sort(([a], [b]) => a.localeCompare(b))
  );
}

export function registerFmt(program: Command): void {
  program
    .command('fmt')
    .description('Sort and normalize vault entries alphabetically by key')
    .option('-d, --dir <directory>', 'Vault directory', process.cwd())
    .option('--dry-run', 'Preview changes without writing', false)
    .action(async (opts) => {
      assertVaultUnlocked(opts.dir);

      if (!vaultExists(opts.dir)) {
        console.error('No vault found. Run `envault init` first.');
        process.exit(1);
      }

      const password = await promptPassword('Enter vault password: ');
      const vaultPath = getVaultPath(opts.dir);
      const raw = fs.readFileSync(vaultPath, 'utf-8');

      let entries: Record<string, string>;
      try {
        entries = await decryptVault(raw, password);
      } catch {
        console.error('Failed to decrypt vault. Wrong password?');
        process.exit(1);
      }

      const sorted = sortEntries(entries);
      const keys = Object.keys(sorted);
      const changed = JSON.stringify(Object.keys(entries)) !== JSON.stringify(keys);

      if (!changed) {
        console.log('Vault is already sorted. No changes needed.');
        return;
      }

      if (opts.dryRun) {
        console.log('Sorted key order (dry run):');
        keys.forEach((k) => console.log(`  ${k}`));
        return;
      }

      const encrypted = await encryptVault(sorted, password);
      fs.writeFileSync(vaultPath, encrypted, 'utf-8');
      console.log(`Formatted vault: ${keys.length} entries sorted alphabetically.`);
    });
}
