import fs from 'fs';
import os from 'os';
import path from 'path';
import { getNotesFilePath, readNotes, writeNotes } from './notes';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-notes-'));
}

describe('notes helpers', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('getNotesFilePath returns correct path', () => {
    const result = getNotesFilePath(tmpDir);
    expect(result).toBe(path.join(tmpDir, '.notes.json'));
  });

  it('readNotes returns empty object when file does not exist', () => {
    const result = readNotes(tmpDir);
    expect(result).toEqual({});
  });

  it('writeNotes writes notes to disk', () => {
    const notes = { MY_KEY: 'this is a note' };
    writeNotes(tmpDir, notes);
    const filePath = getNotesFilePath(tmpDir);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(content).toEqual(notes);
  });

  it('readNotes returns written notes', () => {
    const notes = { API_KEY: 'rotate monthly', DB_PASS: 'prod only' };
    writeNotes(tmpDir, notes);
    const result = readNotes(tmpDir);
    expect(result).toEqual(notes);
  });

  it('readNotes returns empty object on malformed JSON', () => {
    const filePath = getNotesFilePath(tmpDir);
    fs.writeFileSync(filePath, 'not valid json', 'utf-8');
    const result = readNotes(tmpDir);
    expect(result).toEqual({});
  });

  it('writeNotes overwrites existing notes', () => {
    writeNotes(tmpDir, { A: 'first' });
    writeNotes(tmpDir, { B: 'second' });
    const result = readNotes(tmpDir);
    expect(result).toEqual({ B: 'second' });
  });

  it('can delete a note by removing key and rewriting', () => {
    writeNotes(tmpDir, { A: 'note a', B: 'note b' });
    const existing = readNotes(tmpDir);
    delete existing['A'];
    writeNotes(tmpDir, existing);
    const result = readNotes(tmpDir);
    expect(result).toEqual({ B: 'note b' });
    expect(result['A']).toBeUndefined();
  });
});
