import * as readline from 'readline';
import { vaultExists, getVaultPath } from '../../vault/store';
import { decryptVault, encryptVault } from '../../crypto/index';
import * as fs from 'fs/promises';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function rotateCommand(vaultDir: string = process.cwd()): Promise<void> {
  if (!vaultExists(vaultDir)) {
    console.error('No vault found in this directory. Run `envault init` first.');
    process.exit(1);
  }

  const currentPassword = await promptPassword('Current password: ');
  const vaultPath = getVaultPath(vaultDir);

  let entries: Record<string, string>;
  try {
    const raw = await fs.readFile(vaultPath, 'utf-8');
    entries = await decryptVault(raw, currentPassword);
  } catch {
    console.error('Failed to decrypt vault. Check your current password.');
    process.exit(1);
  }

  const newPassword = await promptPassword('New password: ');
  const confirmPassword = await promptPassword('Confirm new password: ');

  if (newPassword !== confirmPassword) {
    console.error('Passwords do not match. Rotation aborted.');
    process.exit(1);
  }

  if (newPassword.length === 0) {
    console.error('Password cannot be empty.');
    process.exit(1);
  }

  try {
    const encrypted = await encryptVault(entries, newPassword);
    await fs.writeFile(vaultPath, encrypted, 'utf-8');
    console.log('Password rotated successfully.');
  } catch {
    console.error('Failed to re-encrypt vault with new password.');
    process.exit(1);
  }
}
