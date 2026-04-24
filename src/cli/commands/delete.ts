import * as fs from 'fs';
import * as readline from 'readline';
import { deleteEntry, hasEntry } from '../../vault/entries';
import { encryptVault, decryptVault } from '../../crypto';
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

export async function deleteCommand(
  key: string,
  vaultDir: string = process.cwd()
): Promise<void> {
  if (!key) {
    console.error('Usage: envault delete <KEY>');
    process.exit(1);
  }

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

  if (!hasEntry(vault, key)) {
    console.error(`Key "${key}" not found in vault.`);
    process.exit(1);
  }

  const updated = deleteEntry(vault, key);
  const reEncrypted = await encryptVault(updated, password);
  fs.writeFileSync(vaultPath, reEncrypted, 'utf8');

  console.log(`Deleted "${key}" from vault.`);
}
