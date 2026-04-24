import { Command } from 'commander';
import * as readline from 'readline';
import { decryptVault, encryptVault } from '../../crypto/index';
import { getVaultPath, vaultExists } from '../../vault/store';
import * as fs from 'fs/promises';

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const write = (rl as any).output;
    write.write(prompt);
    (rl as any)._writeToOutput = () => {};
    rl.question('', (answer) => {
      write.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

export function registerChangePassword(program: Command): void {
  program
    .command('change-password')
    .description('Change the master password for the vault')
    .action(async () => {
      const vaultPath = getVaultPath();

      if (!(await vaultExists())) {
        console.error('No vault found. Run `envault init` to create one.');
        process.exit(1);
      }

      try {
        const currentPassword = await promptPassword('Current password: ');
        const encryptedData = await fs.readFile(vaultPath, 'utf-8');
        let vault: Record<string, string>;

        try {
          vault = await decryptVault(encryptedData, currentPassword);
        } catch {
          console.error('Incorrect current password.');
          process.exit(1);
        }

        const newPassword = await promptPassword('New password: ');
        const confirmPassword = await promptPassword('Confirm new password: ');

        if (newPassword !== confirmPassword) {
          console.error('Passwords do not match.');
          process.exit(1);
        }

        if (newPassword.length < 8) {
          console.error('Password must be at least 8 characters.');
          process.exit(1);
        }

        const newEncrypted = await encryptVault(vault, newPassword);
        await fs.writeFile(vaultPath, newEncrypted, 'utf-8');

        console.log('Password changed successfully.');
      } catch (err) {
        console.error('Failed to change password:', (err as Error).message);
        process.exit(1);
      }
    });
}
