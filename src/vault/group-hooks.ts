import * as fs from 'fs';
import * as path from 'path';

export type GroupMap = Record<string, string[]>;

export function getGroupFilePath(vaultDir: string): string {
  return path.join(vaultDir, '.groups.json');
}

export function readGroups(vaultDir: string): GroupMap {
  const filePath = getGroupFilePath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as GroupMap;
  } catch {
    return {};
  }
}

export function writeGroups(vaultDir: string, groups: GroupMap): void {
  const filePath = getGroupFilePath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(groups, null, 2), 'utf-8');
}

export function addKeyToGroup(vaultDir: string, group: string, key: string): void {
  const groups = readGroups(vaultDir);
  if (!groups[group]) groups[group] = [];
  if (!groups[group].includes(key)) {
    groups[group].push(key);
    writeGroups(vaultDir, groups);
  }
}

export function removeKeyFromGroup(vaultDir: string, group: string, key: string): void {
  const groups = readGroups(vaultDir);
  if (!groups[group]) return;
  groups[group] = groups[group].filter((k) => k !== key);
  if (groups[group].length === 0) delete groups[group];
  writeGroups(vaultDir, groups);
}

export function getGroupsForKey(vaultDir: string, key: string): string[] {
  const groups = readGroups(vaultDir);
  return Object.entries(groups)
    .filter(([, keys]) => keys.includes(key))
    .map(([group]) => group);
}

export function getKeysInGroup(vaultDir: string, group: string): string[] {
  const groups = readGroups(vaultDir);
  return groups[group] ?? [];
}

export function renameGroupKey(vaultDir: string, oldKey: string, newKey: string): void {
  const groups = readGroups(vaultDir);
  let changed = false;
  for (const group of Object.keys(groups)) {
    const idx = groups[group].indexOf(oldKey);
    if (idx !== -1) {
      groups[group][idx] = newKey;
      changed = true;
    }
  }
  if (changed) writeGroups(vaultDir, groups);
}

export function deleteKeyFromAllGroups(vaultDir: string, key: string): void {
  const groups = readGroups(vaultDir);
  let changed = false;
  for (const group of Object.keys(groups)) {
    const before = groups[group].length;
    groups[group] = groups[group].filter((k) => k !== key);
    if (groups[group].length === 0) delete groups[group];
    else if (groups[group].length !== before) changed = true;
    else changed = true;
  }
  if (changed) writeGroups(vaultDir, groups);
}
