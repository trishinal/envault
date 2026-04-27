import { Command } from 'commander';
import * as readline from 'readline';
import { decryptVault } from '../../crypto/index.js';
import { getVaultPath, vaultExists } from '../../vault/store.js';
import { listEntries, getEntry } from '../../vault/entries.js';
import { assertVaultUnlocked } from './lock-guard.js';
import * as fs from 'fs';

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
    process.stderr.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function formatEnvLine(key: string, value: string): string {
  const needsQuotes = /[\s"'\\#]/.test(value);
  const escaped = needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value;
  return `${key}=${escaped}`;
}

export function registerEnv(program: Command): void {
  program
    .command('env')
    .description('Print vault entries as shell export statements')
    .option('-f, --filter <pattern>', 'Only include keys matching pattern')
    .option('--no-export', 'Omit the export keyword')
    .action(async (opts) => {
      try {
        assertVaultUnlocked();

        const vaultPath = getVaultPath();
        if (!vaultExists()) {
          console.error('No vault found. Run `envault init` first.');
          process.exit(1);
        }

        const password = await promptPassword('Vault password: ');
        const raw = fs.readFileSync(vaultPath, 'utf-8');
        const vault = await decryptVault(raw, password);
        const keys = listEntries(vault);

        const filtered = opts.filter
          ? keys.filter((k) => k.toLowerCase().includes(opts.filter.toLowerCase()))
          : keys;

        if (filtered.length === 0) {
          console.error('No matching entries found.');
          process.exit(0);
        }

        const prefix = opts.export !== false ? 'export ' : '';
        for (const key of filtered) {
          const value = getEntry(vault, key) ?? '';
          console.log(`${prefix}${formatEnvLine(key, value)}`);
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
