import { Command } from 'commander';
import * as readline from 'readline';
import * as path from 'path';
import { getVaultPath, vaultExists } from '../../vault/store';
import { decryptVault, encryptVault } from '../../crypto';
import {
  setPriorityForKey,
  getPriorityForKey,
  clearPriorityForKey,
  getKeysByPriority,
  Priority,
} from '../../vault/priority-hooks';
import { assertVaultUnlocked } from './lock-guard';

const VALID_PRIORITIES: Priority[] = ['low', 'normal', 'high', 'critical'];

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    rl.question('', (answer) => { rl.close(); resolve(answer); });
  });
}

export function registerPriority(program: Command): void {
  const cmd = program.command('priority').description('Manage entry priorities');

  cmd
    .command('set <key> <priority>')
    .description('Set priority for a key (low, normal, high, critical)')
    .action(async (key: string, priority: string) => {
      if (!VALID_PRIORITIES.includes(priority as Priority)) {
        console.error(`Invalid priority. Choose from: ${VALID_PRIORITIES.join(', ')}`);
        process.exit(1);
      }
      assertVaultUnlocked();
      if (!vaultExists()) { console.error('No vault found. Run: envault init'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const vaultPath = getVaultPath();
      const vaultDir = path.dirname(vaultPath);
      await decryptVault(vaultPath, password);
      setPriorityForKey(vaultDir, key, priority as Priority);
      console.log(`Priority for "${key}" set to "${priority}".`);
    });

  cmd
    .command('get <key>')
    .description('Get priority for a key')
    .action(async (key: string) => {
      assertVaultUnlocked();
      if (!vaultExists()) { console.error('No vault found. Run: envault init'); process.exit(1); }
      const vaultDir = path.dirname(getVaultPath());
      const priority = getPriorityForKey(vaultDir, key);
      console.log(`${key}: ${priority}`);
    });

  cmd
    .command('clear <key>')
    .description('Clear priority for a key')
    .action(async (key: string) => {
      assertVaultUnlocked();
      if (!vaultExists()) { console.error('No vault found. Run: envault init'); process.exit(1); }
      const vaultDir = path.dirname(getVaultPath());
      clearPriorityForKey(vaultDir, key);
      console.log(`Priority for "${key}" cleared.`);
    });

  cmd
    .command('list [priority]')
    .description('List keys by priority level')
    .action(async (priority?: string) => {
      assertVaultUnlocked();
      if (!vaultExists()) { console.error('No vault found. Run: envault init'); process.exit(1); }
      const vaultDir = path.dirname(getVaultPath());
      const levels: Priority[] = priority ? [priority as Priority] : VALID_PRIORITIES;
      for (const level of levels) {
        const keys = getKeysByPriority(vaultDir, level);
        if (keys.length > 0) {
          console.log(`\n[${level.toUpperCase()}]`);
          keys.forEach((k) => console.log(`  ${k}`));
        }
      }
    });
}
