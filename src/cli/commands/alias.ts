import { Command } from 'commander';
import * as readline from 'readline';
import * as path from 'path';
import * as fs from 'fs';
import { getVaultPath, vaultExists } from '../../vault/store';
import { assertVaultUnlocked } from './lock-guard';

export function getAliasFilePath(vaultDir: string): string {
  return path.join(vaultDir, '.aliases.json');
}

export function readAliases(vaultDir: string): Record<string, string> {
  const filePath = getAliasFilePath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

export function writeAliases(vaultDir: string, aliases: Record<string, string>): void {
  const filePath = getAliasFilePath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(aliases, null, 2), 'utf-8');
}

export function resolveAlias(vaultDir: string, keyOrAlias: string): string {
  const aliases = readAliases(vaultDir);
  return aliases[keyOrAlias] ?? keyOrAlias;
}

function promptPassword(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('Password: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerAlias(program: Command): void {
  const alias = program.command('alias').description('Manage key aliases in the vault');

  alias
    .command('set <alias> <key>')
    .description('Create an alias for an existing key')
    .action(async (aliasName: string, key: string) => {
      const vaultDir = path.dirname(getVaultPath());
      if (!vaultExists()) { console.error('No vault found. Run `envault init` first.'); process.exit(1); }
      assertVaultUnlocked(vaultDir);
      const aliases = readAliases(vaultDir);
      aliases[aliasName] = key;
      writeAliases(vaultDir, aliases);
      console.log(`Alias '${aliasName}' -> '${key}' saved.`);
    });

  alias
    .command('remove <alias>')
    .description('Remove an alias')
    .action(async (aliasName: string) => {
      const vaultDir = path.dirname(getVaultPath());
      if (!vaultExists()) { console.error('No vault found. Run `envault init` first.'); process.exit(1); }
      assertVaultUnlocked(vaultDir);
      const aliases = readAliases(vaultDir);
      if (!(aliasName in aliases)) { console.error(`Alias '${aliasName}' not found.`); process.exit(1); }
      delete aliases[aliasName];
      writeAliases(vaultDir, aliases);
      console.log(`Alias '${aliasName}' removed.`);
    });

  alias
    .command('list')
    .description('List all aliases')
    .action(async () => {
      const vaultDir = path.dirname(getVaultPath());
      if (!vaultExists()) { console.error('No vault found. Run `envault init` first.'); process.exit(1); }
      const aliases = readAliases(vaultDir);
      const entries = Object.entries(aliases);
      if (entries.length === 0) { console.log('No aliases defined.'); return; }
      entries.forEach(([a, k]) => console.log(`${a} -> ${k}`));
    });
}
