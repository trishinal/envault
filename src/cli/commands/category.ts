import { Command } from 'commander';
import * as readline from 'readline';
import * as path from 'path';
import { getVaultPath, vaultExists } from '../../vault/store';
import { decryptVault } from '../../crypto';
import {
  setCategoryForKey,
  getCategoryForKey,
  removeCategoryForKey,
  getKeysByCategory,
  listCategories,
} from '../../vault/category-hooks';
import { assertVaultUnlocked } from './lock-guard';

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    let password = '';
    process.stdin.on('data', (ch) => {
      const char = ch.toString();
      if (char === '\n' || char === '\r') {
        process.stdin.setRawMode?.(false);
        process.stdout.write('\n');
        rl.close();
        resolve(password);
      } else if (char === '\u0003') {
        process.exit();
      } else {
        password += char;
      }
    });
  });
}

export function registerCategory(program: Command): void {
  const category = program.command('category').description('Manage entry categories');

  category
    .command('set <key> <category>')
    .description('Assign a category to an entry')
    .action(async (key: string, cat: string) => {
      assertVaultUnlocked();
      const vaultPath = getVaultPath();
      if (!vaultExists()) return console.error('No vault found. Run: envault init');
      const password = await promptPassword('Password: ');
      const vaultDir = path.dirname(vaultPath);
      try {
        await decryptVault(vaultPath, password);
        setCategoryForKey(vaultDir, key, cat);
        console.log(`Category "${cat}" set for "${key}".`);
      } catch {
        console.error('Invalid password or vault corrupted.');
      }
    });

  category
    .command('get <key>')
    .description('Get the category of an entry')
    .action(async (key: string) => {
      assertVaultUnlocked();
      const vaultPath = getVaultPath();
      if (!vaultExists()) return console.error('No vault found. Run: envault init');
      const password = await promptPassword('Password: ');
      const vaultDir = path.dirname(vaultPath);
      try {
        await decryptVault(vaultPath, password);
        const cat = getCategoryForKey(vaultDir, key);
        cat ? console.log(cat) : console.log(`No category set for "${key}".`);
      } catch {
        console.error('Invalid password or vault corrupted.');
      }
    });

  category
    .command('remove <key>')
    .description('Remove the category from an entry')
    .action(async (key: string) => {
      assertVaultUnlocked();
      const vaultPath = getVaultPath();
      if (!vaultExists()) return console.error('No vault found. Run: envault init');
      const password = await promptPassword('Password: ');
      const vaultDir = path.dirname(vaultPath);
      try {
        await decryptVault(vaultPath, password);
        removeCategoryForKey(vaultDir, key);
        console.log(`Category removed from "${key}".`);
      } catch {
        console.error('Invalid password or vault corrupted.');
      }
    });

  category
    .command('list [category]')
    .description('List all categories, or entries in a category')
    .action(async (cat?: string) => {
      assertVaultUnlocked();
      const vaultPath = getVaultPath();
      if (!vaultExists()) return console.error('No vault found. Run: envault init');
      const password = await promptPassword('Password: ');
      const vaultDir = path.dirname(vaultPath);
      try {
        await decryptVault(vaultPath, password);
        if (cat) {
          const keys = getKeysByCategory(vaultDir, cat);
          keys.length ? keys.forEach((k) => console.log(k)) : console.log(`No entries in category "${cat}".`);
        } else {
          const cats = listCategories(vaultDir);
          cats.length ? cats.forEach((c) => console.log(c)) : console.log('No categories defined.');
        }
      } catch {
        console.error('Invalid password or vault corrupted.');
      }
    });
}
