#!/usr/bin/env node
import { initVault } from '../vault/store';
import { setCommand } from './commands/set';
import { getCommand } from './commands/get';
import { listCommand } from './commands/list';
import { deleteCommand } from './commands/delete';

const [, , command, ...args] = process.argv;

async function main(): Promise<void> {
  switch (command) {
    case 'init': {
      const dir = args[0] ?? process.cwd();
      initVault(dir);
      console.log('Vault initialised.');
      break;
    }
    case 'set': {
      const key = args[0];
      const value = args[1];
      if (!key || !value) {
        console.error('Usage: envault set <KEY> <VALUE>');
        process.exit(1);
      }
      await setCommand(key, value);
      break;
    }
    case 'get': {
      const key = args[0];
      if (!key) {
        console.error('Usage: envault get <KEY>');
        process.exit(1);
      }
      await getCommand(key);
      break;
    }
    case 'list': {
      await listCommand();
      break;
    }
    case 'delete': {
      const key = args[0];
      if (!key) {
        console.error('Usage: envault delete <KEY>');
        process.exit(1);
      }
      await deleteCommand(key);
      break;
    }
    default: {
      console.log('envault — secure environment variable manager');
      console.log('');
      console.log('Commands:');
      console.log('  init            Initialise a new vault in the current directory');
      console.log('  set <KEY> <VAL> Store an environment variable');
      console.log('  get <KEY>       Retrieve an environment variable');
      console.log('  list            List all stored keys');
      console.log('  delete <KEY>    Remove an environment variable');
      break;
    }
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
