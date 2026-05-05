import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getGroupFilePath,
  readGroups,
  writeGroups,
  addKeyToGroup,
  removeKeyFromGroup,
  getGroupsForKey,
  getKeysInGroup,
  renameKeyInGroups,
} from './group-hooks';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-group-test-'));
}

describe('group-hooks', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  it('returns correct group file path', () => {
    const p = getGroupFilePath(dir);
    expect(p).toBe(path.join(dir, '.envault-groups.json'));
  });

  it('reads empty groups when file missing', () => {
    const groups = readGroups(dir);
    expect(groups).toEqual({});
  });

  it('writes and reads groups', () => {
    writeGroups(dir, { backend: ['DB_URL', 'API_KEY'] });
    const groups = readGroups(dir);
    expect(groups).toEqual({ backend: ['DB_URL', 'API_KEY'] });
  });

  it('adds a key to a group', () => {
    addKeyToGroup(dir, 'backend', 'DB_URL');
    addKeyToGroup(dir, 'backend', 'API_KEY');
    const groups = readGroups(dir);
    expect(groups['backend']).toContain('DB_URL');
    expect(groups['backend']).toContain('API_KEY');
  });

  it('does not duplicate keys in group', () => {
    addKeyToGroup(dir, 'backend', 'DB_URL');
    addKeyToGroup(dir, 'backend', 'DB_URL');
    expect(readGroups(dir)['backend']).toHaveLength(1);
  });

  it('removes a key from a group', () => {
    addKeyToGroup(dir, 'backend', 'DB_URL');
    addKeyToGroup(dir, 'backend', 'API_KEY');
    removeKeyFromGroup(dir, 'backend', 'DB_URL');
    expect(readGroups(dir)['backend']).not.toContain('DB_URL');
    expect(readGroups(dir)['backend']).toContain('API_KEY');
  });

  it('returns groups that contain a key', () => {
    addKeyToGroup(dir, 'backend', 'DB_URL');
    addKeyToGroup(dir, 'infra', 'DB_URL');
    addKeyToGroup(dir, 'frontend', 'NEXT_PUBLIC_URL');
    const result = getGroupsForKey(dir, 'DB_URL');
    expect(result).toContain('backend');
    expect(result).toContain('infra');
    expect(result).not.toContain('frontend');
  });

  it('returns keys in a group', () => {
    addKeyToGroup(dir, 'backend', 'DB_URL');
    addKeyToGroup(dir, 'backend', 'SECRET');
    expect(getKeysInGroup(dir, 'backend')).toEqual(['DB_URL', 'SECRET']);
  });

  it('renames a key across all groups', () => {
    addKeyToGroup(dir, 'backend', 'OLD_KEY');
    addKeyToGroup(dir, 'infra', 'OLD_KEY');
    renameKeyInGroups(dir, 'OLD_KEY', 'NEW_KEY');
    const groups = readGroups(dir);
    expect(groups['backend']).toContain('NEW_KEY');
    expect(groups['infra']).toContain('NEW_KEY');
    expect(groups['backend']).not.toContain('OLD_KEY');
  });
});
