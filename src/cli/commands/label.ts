import { Command } from 'commander';
import * as readline from 'readline';
import { decryptVault } from '../../crypto/index';
import { getVaultPath, vaultExists } from '../../vault/store';
import {
  addLabelToKey,
  removeLabelFromKey,
  getLabelsForKey,
  getKeysByLabel,
  clearLabelsForKey,
} from '../../vault/label-hooks';
import * as path from 'path';

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerLabel(program: Command): void {
  const label = program.command('label').description('Manage labels for vault entries');

  label
    .command('add <key> <label>')
    .description('Add a label to a key')
    .action(async (key: string, lbl: string) => {
      if (!vaultExists()) { console.error('No vault found. Run envault init first.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const vaultPath = getVaultPath();
      await decryptVault(vaultPath, password);
      const vaultDir = path.dirname(vaultPath);
      addLabelToKey(vaultDir, key, lbl);
      console.log(`Label "${lbl}" added to "${key}".`);
    });

  label
    .command('remove <key> <label>')
    .description('Remove a label from a key')
    .action(async (key: string, lbl: string) => {
      if (!vaultExists()) { console.error('No vault found.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const vaultPath = getVaultPath();
      await decryptVault(vaultPath, password);
      const vaultDir = path.dirname(vaultPath);
      removeLabelFromKey(vaultDir, key, lbl);
      console.log(`Label "${lbl}" removed from "${key}".`);
    });

  label
    .command('list <key>')
    .description('List labels for a key')
    .action(async (key: string) => {
      if (!vaultExists()) { console.error('No vault found.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const vaultPath = getVaultPath();
      await decryptVault(vaultPath, password);
      const vaultDir = path.dirname(vaultPath);
      const labels = getLabelsForKey(vaultDir, key);
      if (labels.length === 0) { console.log(`No labels for "${key}".`); return; }
      labels.forEach((l) => console.log(`  - ${l}`));
    });

  label
    .command('keys <label>')
    .description('List keys with a given label')
    .action(async (lbl: string) => {
      if (!vaultExists()) { console.error('No vault found.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const vaultPath = getVaultPath();
      await decryptVault(vaultPath, password);
      const vaultDir = path.dirname(vaultPath);
      const keys = getKeysByLabel(vaultDir, lbl);
      if (keys.length === 0) { console.log(`No keys with label "${lbl}".`); return; }
      keys.forEach((k) => console.log(`  ${k}`));
    });

  label
    .command('clear <key>')
    .description('Clear all labels for a key')
    .action(async (key: string) => {
      if (!vaultExists()) { console.error('No vault found.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const vaultPath = getVaultPath();
      await decryptVault(vaultPath, password);
      const vaultDir = path.dirname(vaultPath);
      clearLabelsForKey(vaultDir, key);
      console.log(`All labels cleared for "${key}".`);
    });
}
