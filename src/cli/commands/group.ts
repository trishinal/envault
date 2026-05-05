import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { Command } from 'commander';
import { getVaultPath, vaultExists } from '../../vault/store';
import { decryptVault } from '../../crypto';
import {
  readGroups,
  addKeyToGroup,
  removeKeyFromGroup,
  getKeysInGroup,
  getGroupsForKey,
} from '../../vault/group-hooks';

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
  });
}

export function registerGroup(program: Command): void {
  const group = program.command('group').description('Manage entry groups');

  group
    .command('add <group> <key>')
    .description('Add a key to a group')
    .option('--vault <path>', 'Path to vault directory')
    .action(async (groupName: string, key: string, opts: { vault?: string }) => {
      const vaultDir = opts.vault ?? process.cwd();
      if (!vaultExists(vaultDir)) { console.error('No vault found.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const vaultPath = getVaultPath(vaultDir);
      await decryptVault(fs.readFileSync(vaultPath, 'utf-8'), password);
      addKeyToGroup(vaultDir, groupName, key);
      console.log(`Added '${key}' to group '${groupName}'.`);
    });

  group
    .command('remove <group> <key>')
    .description('Remove a key from a group')
    .option('--vault <path>', 'Path to vault directory')
    .action(async (groupName: string, key: string, opts: { vault?: string }) => {
      const vaultDir = opts.vault ?? process.cwd();
      if (!vaultExists(vaultDir)) { console.error('No vault found.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const vaultPath = getVaultPath(vaultDir);
      await decryptVault(fs.readFileSync(vaultPath, 'utf-8'), password);
      removeKeyFromGroup(vaultDir, groupName, key);
      console.log(`Removed '${key}' from group '${groupName}'.`);
    });

  group
    .command('list [group]')
    .description('List groups or keys in a group')
    .option('--vault <path>', 'Path to vault directory')
    .action(async (groupName: string | undefined, opts: { vault?: string }) => {
      const vaultDir = opts.vault ?? process.cwd();
      if (!vaultExists(vaultDir)) { console.error('No vault found.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const vaultPath = getVaultPath(vaultDir);
      await decryptVault(fs.readFileSync(vaultPath, 'utf-8'), password);
      if (groupName) {
        const keys = getKeysInGroup(vaultDir, groupName);
        if (keys.length === 0) { console.log(`Group '${groupName}' is empty or does not exist.`); return; }
        console.log(`Keys in '${groupName}':\n` + keys.map((k) => `  ${k}`).join('\n'));
      } else {
        const groups = readGroups(vaultDir);
        const names = Object.keys(groups);
        if (names.length === 0) { console.log('No groups defined.'); return; }
        console.log('Groups:\n' + names.map((g) => `  ${g} (${groups[g].length})`).join('\n'));
      }
    });

  group
    .command('of <key>')
    .description('Show which groups a key belongs to')
    .option('--vault <path>', 'Path to vault directory')
    .action(async (key: string, opts: { vault?: string }) => {
      const vaultDir = opts.vault ?? process.cwd();
      if (!vaultExists(vaultDir)) { console.error('No vault found.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const vaultPath = getVaultPath(vaultDir);
      await decryptVault(fs.readFileSync(vaultPath, 'utf-8'), password);
      const groups = getGroupsForKey(vaultDir, key);
      if (groups.length === 0) { console.log(`'${key}' is not in any group.`); return; }
      console.log(`'${key}' is in: ${groups.join(', ')}`);
    });
}
