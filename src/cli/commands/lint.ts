import { Command } from 'commander';
import * as readline from 'readline';
import { vaultExists } from '../../vault/store';
import { listEntries } from '../../vault/entries';
import { decryptVault } from '../../crypto';
import { assertVaultUnlocked } from './lock-guard';

function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    process.stderr.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export interface LintResult {
  key: string;
  warnings: string[];
}

export function lintEntries(entries: Record<string, string>): LintResult[] {
  const results: LintResult[] = [];
  for (const [key, value] of Object.entries(entries)) {
    const warnings: string[] = [];
    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
      warnings.push('Key should be UPPER_SNAKE_CASE');
    }
    if (value.trim() === '') {
      warnings.push('Value is empty or whitespace only');
    }
    if (value.length > 4096) {
      warnings.push('Value is unusually long (>4096 chars)');
    }
    if (/\s/.test(value) && !value.startsWith('"') && !value.startsWith("'")) {
      warnings.push('Value contains whitespace but is not quoted');
    }
    if (warnings.length > 0) {
      results.push({ key, warnings });
    }
  }
  return results;
}

export function registerLint(program: Command): void {
  program
    .command('lint')
    .description('Check vault entries for common issues and naming conventions')
    .option('--vault <path>', 'Path to vault file')
    .action(async (options) => {
      assertVaultUnlocked();
      if (!vaultExists(options.vault)) {
        console.error('No vault found. Run `envault init` first.');
        process.exit(1);
      }
      const password = await promptPassword('Enter vault password: ');
      try {
        const entries = await listEntries(options.vault, password, decryptVault);
        const results = lintEntries(entries);
        if (results.length === 0) {
          console.log('✔ No issues found in vault entries.');
          return;
        }
        console.log(`Found ${results.length} issue(s):\n`);
        for (const { key, warnings } of results) {
          console.log(`  ${key}`);
          for (const w of warnings) {
            console.log(`    ⚠ ${w}`);
          }
        }
        process.exit(1);
      } catch {
        console.error('Failed to decrypt vault. Wrong password?');
        process.exit(1);
      }
    });
}
