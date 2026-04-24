import * as readline from 'readline';
import { getVaultPath, vaultExists } from '../../vault/store';
import { listEntries } from '../../vault/entries';
import { decryptVault } from '../../crypto';
import * as fs from 'fs';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    let password = '';
    process.stdin.on('data', (char) => {
      const c = char.toString();
      if (c === '\n' || c === '\r') {
        process.stdin.setRawMode?.(false);
        process.stdout.write('\n');
        rl.close();
        resolve(password);
      } else if (c === '\u0003') {
        process.exit();
      } else {
        password += c;
      }
    });
  });
}

export async function searchCommand(pattern: string, vaultDir: string = process.cwd()): Promise<void> {
  if (!pattern || pattern.trim() === '') {
    console.error('Error: search pattern is required.');
    process.exit(1);
  }

  if (!vaultExists(vaultDir)) {
    console.error('No vault found in this directory. Run `envault init` first.');
    process.exit(1);
  }

  const password = await promptPassword('Enter vault password: ');
  const vaultPath = getVaultPath(vaultDir);
  const encrypted = fs.readFileSync(vaultPath, 'utf-8');

  let vault: Record<string, string>;
  try {
    vault = await decryptVault(encrypted, password);
  } catch {
    console.error('Error: incorrect password or corrupted vault.');
    process.exit(1);
  }

  const keys = listEntries(vault);
  const lowerPattern = pattern.toLowerCase();
  const matches = keys.filter((key) => key.toLowerCase().includes(lowerPattern));

  if (matches.length === 0) {
    console.log(`No entries found matching "${pattern}".`);
    return;
  }

  console.log(`Found ${matches.length} matching entr${matches.length === 1 ? 'y' : 'ies'}:`);
  for (const key of matches) {
    console.log(`  ${key}`);
  }
}
