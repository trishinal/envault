import { Command } from 'commander';
import * as readline from 'readline';
import { decryptVault, encryptVault } from '../../crypto/index.js';
import { getVaultPath, vaultExists } from '../../vault/store.js';
import { listEntries } from '../../vault/entries.js';
import * as fs from 'fs/promises';

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    let password = '';
    process.stdin.on('data', (char) => {
      const c = char.toString();
      if (c === '\n' || c === '\r') {
        process.stdin.setRawMode?.(false);
        process.stdout.write('\n');
        rl.close();
        resolve(password);
      } else if (c === '\u0003') {
        process.exit();
      } else {
        password += c;
      }
    });
  });
}

export function renderTemplate(template: string, entries: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(entries, key) ? entries[key] : match;
  });
}

export function registerTemplate(program: Command): void {
  program
    .command('template <templateFile> <outputFile>')
    .description('Render a template file by substituting {{ KEY }} placeholders with vault entries')
    .option('-d, --dir <dir>', 'vault directory', process.cwd())
    .action(async (templateFile: string, outputFile: string, opts: { dir: string }) => {
      if (!vaultExists(opts.dir)) {
        console.error('No vault found. Run `envault init` first.');
        process.exit(1);
      }

      const password = await promptPassword('Enter vault password: ');

      try {
        const vaultPath = getVaultPath(opts.dir);
        const encrypted = await fs.readFile(vaultPath, 'utf-8');
        const vault = await decryptVault(encrypted, password);
        const entries = listEntries(vault);

        const entryMap: Record<string, string> = {};
        for (const { key, value } of entries) {
          entryMap[key] = value;
        }

        const templateContent = await fs.readFile(templateFile, 'utf-8');
        const rendered = renderTemplate(templateContent, entryMap);

        await fs.writeFile(outputFile, rendered, 'utf-8');
        console.log(`Template rendered to ${outputFile}`);
      } catch (err) {
        console.error('Failed to render template:', (err as Error).message);
        process.exit(1);
      }
    });
}
