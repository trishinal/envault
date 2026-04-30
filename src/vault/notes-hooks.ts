import path from 'path';
import { getVaultPath } from './store';
import { readNotes, writeNotes } from '../cli/commands/notes';

/**
 * Returns the note for a given key, or undefined if none exists.
 */
export function getNoteForKey(key: string): string | undefined {
  const vaultDir = path.dirname(getVaultPath());
  const notes = readNotes(vaultDir);
  return notes[key];
}

/**
 * Sets or updates a note for a given key.
 */
export function setNoteForKey(key: string, note: string): void {
  const vaultDir = path.dirname(getVaultPath());
  const notes = readNotes(vaultDir);
  notes[key] = note;
  writeNotes(vaultDir, notes);
}

/**
 * Removes the note for a given key if it exists.
 */
export function clearNoteForKey(key: string): void {
  const vaultDir = path.dirname(getVaultPath());
  const notes = readNotes(vaultDir);
  if (key in notes) {
    delete notes[key];
    writeNotes(vaultDir, notes);
  }
}

/**
 * Returns all keys that have notes attached.
 */
export function getKeysWithNotes(): string[] {
  const vaultDir = path.dirname(getVaultPath());
  const notes = readNotes(vaultDir);
  return Object.keys(notes);
}

/**
 * Renames the note key when an entry is renamed.
 */
export function renameNoteKey(oldKey: string, newKey: string): void {
  const vaultDir = path.dirname(getVaultPath());
  const notes = readNotes(vaultDir);
  if (oldKey in notes) {
    notes[newKey] = notes[oldKey];
    delete notes[oldKey];
    writeNotes(vaultDir, notes);
  }
}
