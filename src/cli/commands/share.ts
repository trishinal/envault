import { Command } from 'commander';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { decryptVault, encryptVault } from '../../crypto/index';
import { getVaultPath, vaultExists } from '../../vault/store';
import { assertVaultUnlocked } from './lock-guard';

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

export function generateShareToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('hex');
}

export function getShareDir(vaultDir: string): string {
  return path.join(vaultDir, '.shares');
}

export function getSharePath(vaultDir: string, token: string): string {
  return path.join(getShareDir(vaultDir), `${token}.share`);
}

export function registerShare(program: Command): void {
  program
    .command('share')
    .description('Export a re-encrypted vault snapshot for sharing')
    .option('-k, --keys <keys>', 'Comma-separated list of keys to share (default: all)')
    .option('-o, --output <file>', 'Output file path (default: auto-generated share token)')
    .action(async (opts) => {
      const vaultDir = process.cwd();
      assertVaultUnlocked(vaultDir);
      if (!vaultExists(vaultDir)) {
        console.error('No vault found. Run `envault init` first.');
        process.exit(1);
      }

      const password = await promptPassword('Enter vault password: ');
      const sharePassword = await promptPassword('Enter share password (recipient will need this): ');

      const vaultPath = getVaultPath(vaultDir);
      const raw = fs.readFileSync(vaultPath, 'utf-8');
      const entries = await decryptVault(raw, password);

      let filtered = entries;
      if (opts.keys) {
        const keys = opts.keys.split(',').map((k: string) => k.trim());
        filtered = entries.filter((e: { key: string }) => keys.includes(e.key));
        if (filtered.length === 0) {
          console.error('No matching keys found.');
          process.exit(1);
        }
      }

      const shareContent = await encryptVault(filtered, sharePassword);
      const token = generateShareToken();
      const outPath = opts.output ?? getSharePath(vaultDir, token);

      if (!opts.output) {
        const shareDir = getShareDir(vaultDir);
        if (!fs.existsSync(shareDir)) fs.mkdirSync(shareDir, { recursive: true });
      }

      fs.writeFileSync(outPath, shareContent, 'utf-8');
      console.log(`Share file created: ${outPath}`);
      console.log(`Share token: ${token}`);
      console.log(`Send the file and share password to the recipient.`);
    });
}
