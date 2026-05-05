import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setPriorityForKey,
  getPriorityForKey,
  clearPriorityForKey,
  getKeysByPriority,
  renamePriorityKey,
  readPriorities,
} from '../../vault/priority-hooks';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-priority-'));
}

describe('priority-hooks', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTempDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('returns normal priority by default', () => {
    expect(getPriorityForKey(tmpDir, 'API_KEY')).toBe('normal');
  });

  it('sets and gets a priority', () => {
    setPriorityForKey(tmpDir, 'DB_PASS', 'critical');
    expect(getPriorityForKey(tmpDir, 'DB_PASS')).toBe('critical');
  });

  it('overwrites existing priority', () => {
    setPriorityForKey(tmpDir, 'TOKEN', 'low');
    setPriorityForKey(tmpDir, 'TOKEN', 'high');
    expect(getPriorityForKey(tmpDir, 'TOKEN')).toBe('high');
  });

  it('clears a priority', () => {
    setPriorityForKey(tmpDir, 'SECRET', 'high');
    clearPriorityForKey(tmpDir, 'SECRET');
    expect(getPriorityForKey(tmpDir, 'SECRET')).toBe('normal');
  });

  it('lists keys by priority level', () => {
    setPriorityForKey(tmpDir, 'A', 'high');
    setPriorityForKey(tmpDir, 'B', 'critical');
    setPriorityForKey(tmpDir, 'C', 'high');
    const highKeys = getKeysByPriority(tmpDir, 'high');
    expect(highKeys).toContain('A');
    expect(highKeys).toContain('C');
    expect(highKeys).not.toContain('B');
  });

  it('renames a priority key', () => {
    setPriorityForKey(tmpDir, 'OLD_KEY', 'critical');
    renamePriorityKey(tmpDir, 'OLD_KEY', 'NEW_KEY');
    const priorities = readPriorities(tmpDir);
    expect(priorities['NEW_KEY']).toBe('critical');
    expect(priorities['OLD_KEY']).toBeUndefined();
  });

  it('handles rename of non-existent key gracefully', () => {
    expect(() => renamePriorityKey(tmpDir, 'GHOST', 'NEW')).not.toThrow();
  });

  it('returns empty array when no keys match priority', () => {
    expect(getKeysByPriority(tmpDir, 'low')).toEqual([]);
  });
});
