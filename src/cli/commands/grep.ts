import { Command } from 'commander';
import * as readline from 'readline';
import { decryptVault } from '../../crypto/index.js';
import { getVaultPath, vaultExists } from '../../vault/store.js';
import { listEntries, getEntry } from '../../vault/entries.js';
import { assertVaultUnlocked } from './lock-guard.js';
import * as fs from 'fs';

function promptPassword(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    process.stderr.write('Password: ');
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function grepEntries(
  entries: Record<string, string>,
  pattern: string,
  options: { keys?: boolean; values?: boolean; ignoreCase?: boolean }
): Array<{ key: string; value: string; matchedIn: 'key' | 'value' | 'both' }> {
  const flags = options.ignoreCase ? 'i' : '';
  const regex = new RegExp(pattern, flags);
  const searchKeys = options.keys !== false;
  const searchValues = options.values !== false;

  return Object.entries(entries)
    .map(([key, value]) => {
      const matchKey = searchKeys && regex.test(key);
      const matchValue = searchValues && regex.test(value);
      if (!matchKey && !matchValue) return null;
      const matchedIn: 'key' | 'value' | 'both' =
        matchKey && matchValue ? 'both' : matchKey ? 'key' : 'value';
      return { key, value, matchedIn };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
}

export function registerGrep(program: Command): void {
  program
    .command('grep <pattern>')
    .description('Search vault entries by regex pattern against keys and/or values')
    .option('-k, --keys-only', 'Search keys only')
    .option('-v, --values-only', 'Search values only')
    .option('-i, --ignore-case', 'Case-insensitive matching')
    .option('--show-values', 'Show matched values in output (hidden by default)')
    .action(async (pattern: string, opts) => {
      assertVaultUnlocked();
      const vaultPath = getVaultPath();
      if (!vaultExists()) {
        console.error('No vault found. Run `envault init` first.');
        process.exit(1);
      }
      const password = await promptPassword();
      const encrypted = fs.readFileSync(vaultPath, 'utf-8');
      let vault: Record<string, string>;
      try {
        vault = await decryptVault(encrypted, password);
      } catch {
        console.error('Failed to decrypt vault. Wrong password?');
        process.exit(1);
      }
      const results = grepEntries(vault, pattern, {
        keys: !opts.valuesOnly,
        values: !opts.keysOnly,
        ignoreCase: !!opts.ignoreCase,
      });
      if (results.length === 0) {
        console.log('No matches found.');
        return;
      }
      for (const { key, value, matchedIn } of results) {
        const display = opts.showValues ? `${key}=${value}` : key;
        console.log(`${display}  [matched: ${matchedIn}]`);
      }
    });
}
