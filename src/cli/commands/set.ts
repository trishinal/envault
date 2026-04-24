import { Command } from 'commander';
import * as readline from 'readline';
import { setEntry } from '../../vault/entries';
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

export const setCommand = new Command('set')
  .description('Set an environment variable in the vault')
  .argument('<key>', 'Variable name (e.g. DATABASE_URL)')
  .argument('[value]', 'Variable value (omit to be prompted securely)')
  .option('-p, --password <password>', 'Vault master password')
  .action(async (key: string, value: string | undefined, opts: { password?: string }) => {
    if (!vaultExists()) {
      console.error('No vault found. Run `envault init` first.');
      process.exit(1);
    }

    const password = opts.password ?? await promptPassword('Master password: ');

    if (!value) {
      value = await promptPassword(`Value for ${key}: `);
    }

    try {
      await setEntry(password, key, value);
      console.log(`✔ Set ${key}`);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });
