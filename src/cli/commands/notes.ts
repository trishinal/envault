import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { getVaultPath, vaultExists } from '../../vault/store';
import { decryptVault, encryptVault } from '../../crypto';
import { assertVaultUnlocked } from './lock-guard';

function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function getNotesFilePath(vaultDir: string): string {
  return path.join(vaultDir, '.notes.json');
}

export function readNotes(vaultDir: string): Record<string, string> {
  const notesPath = getNotesFilePath(vaultDir);
  if (!fs.existsSync(notesPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(notesPath, 'utf-8'));
  } catch {
    return {};
  }
}

export function writeNotes(vaultDir: string, notes: Record<string, string>): void {
  const notesPath = getNotesFilePath(vaultDir);
  fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2), 'utf-8');
}

export function registerNotes(program: any) {
  const notes = program.command('notes').description('Manage notes attached to vault entries');

  notes
    .command('set <key> <note>')
    .description('Attach a note to an entry')
    .action(async (key: string, note: string) => {
      assertVaultUnlocked();
      const vaultDir = path.dirname(getVaultPath());
      if (!vaultExists()) { console.error('No vault found. Run `envault init` first.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const raw = fs.readFileSync(getVaultPath());
      await decryptVault(raw, password);
      const existing = readNotes(vaultDir);
      existing[key] = note;
      writeNotes(vaultDir, existing);
      console.log(`Note set for "${key}".`);
    });

  notes
    .command('get <key>')
    .description('Show the note for an entry')
    .action(async (key: string) => {
      assertVaultUnlocked();
      const vaultDir = path.dirname(getVaultPath());
      if (!vaultExists()) { console.error('No vault found.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const raw = fs.readFileSync(getVaultPath());
      await decryptVault(raw, password);
      const existing = readNotes(vaultDir);
      if (!existing[key]) { console.log(`No note for "${key}".`); return; }
      console.log(`${key}: ${existing[key]}`);
    });

  notes
    .command('delete <key>')
    .description('Remove the note for an entry')
    .action(async (key: string) => {
      assertVaultUnlocked();
      const vaultDir = path.dirname(getVaultPath());
      if (!vaultExists()) { console.error('No vault found.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const raw = fs.readFileSync(getVaultPath());
      await decryptVault(raw, password);
      const existing = readNotes(vaultDir);
      if (!existing[key]) { console.log(`No note for "${key}".`); return; }
      delete existing[key];
      writeNotes(vaultDir, existing);
      console.log(`Note deleted for "${key}".`);
    });

  notes
    .command('list')
    .description('List all entry notes')
    .action(async () => {
      assertVaultUnlocked();
      const vaultDir = path.dirname(getVaultPath());
      if (!vaultExists()) { console.error('No vault found.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const raw = fs.readFileSync(getVaultPath());
      await decryptVault(raw, password);
      const existing = readNotes(vaultDir);
      const keys = Object.keys(existing);
      if (keys.length === 0) { console.log('No notes found.'); return; }
      keys.forEach((k) => console.log(`${k}: ${existing[k]}`));
    });
}
