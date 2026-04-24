import * as fs from 'fs';
import * as readline from 'readline';
import { listEntries } from '../../vault/entries';
import { decryptVault } from '../../crypto';
import { getVaultPath, vaultExists } from '../../vault/store';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });
    process.stderr.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function listCommand(vaultDir: string = process.cwd()): Promise<void> {
  const vaultPath = getVaultPath(vaultDir);

  if (!vaultExists(vaultDir)) {
    console.error('No vault found. Run `envault init` to create one.');
    process.exit(1);
  }

  const password = await promptPassword('Enter vault password: ');

  const encrypted = fs.readFileSync(vaultPath, 'utf8');
  let vault: Record<string, string>;

  try {
    vault = await decryptVault(encrypted, password);
  } catch {
    console.error('Failed to decrypt vault. Wrong password?');
    process.exit(1);
  }

  const keys = listEntries(vault);

  if (keys.length === 0) {
    console.log('Vault is empty.');
  } else {
    console.log('Stored keys:');
    keys.forEach((key) => console.log(`  - ${key}`));
  }
}
