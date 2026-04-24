import { Command } from 'commander';
import * as readline from 'readline';
import { getEntry, listEntries } from '../../vault/entries';
import { vaultExists } from '../../vault/store';

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });
    process.stderr.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      process.stderr.write('\n');
      resolve(answer);
    });
  });
}

export const getCommand = new Command('get')
  .description('Get an environment variable from the vault')
  .argument('[key]', 'Variable name (omit to list all keys)')
  .option('-p, --password <password>', 'Vault master password')
  .option('--export', 'Output in export KEY=VALUE format')
  .action(async (key: string | undefined, opts: { password?: string; export?: boolean }) => {
    if (!vaultExists()) {
      console.error('No vault found. Run `envault init` first.');
      process.exit(1);
    }

    const password = opts.password ?? await promptPassword('Master password: ');

    try {
      if (!key) {
        const keys = await listEntries(password);
        if (keys.length === 0) {
          console.log('Vault is empty.');
        } else {
          keys.forEach((k) => console.log(k));
        }
        return;
      }

      const value = await getEntry(password, key);
      if (value === undefined) {
        console.error(`Key "${key}" not found in vault.`);
        process.exit(1);
      }

      if (opts.export) {
        console.log(`export ${key}=${JSON.stringify(value)}`);
      } else {
        console.log(value);
      }
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });
