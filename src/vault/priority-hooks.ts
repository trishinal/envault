import * as fs from 'fs';
import * as path from 'path';

export type Priority = 'low' | 'normal' | 'high' | 'critical';

export interface PriorityMap {
  [key: string]: Priority;
}

export function getPriorityFilePath(vaultDir: string): string {
  return path.join(vaultDir, '.priority.json');
}

export function readPriorities(vaultDir: string): PriorityMap {
  const filePath = getPriorityFilePath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

export function writePriorities(vaultDir: string, priorities: PriorityMap): void {
  const filePath = getPriorityFilePath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(priorities, null, 2), 'utf-8');
}

export function setPriorityForKey(vaultDir: string, key: string, priority: Priority): void {
  const priorities = readPriorities(vaultDir);
  priorities[key] = priority;
  writePriorities(vaultDir, priorities);
}

export function getPriorityForKey(vaultDir: string, key: string): Priority {
  const priorities = readPriorities(vaultDir);
  return priorities[key] ?? 'normal';
}

export function clearPriorityForKey(vaultDir: string, key: string): void {
  const priorities = readPriorities(vaultDir);
  delete priorities[key];
  writePriorities(vaultDir, priorities);
}

export function getKeysByPriority(vaultDir: string, priority: Priority): string[] {
  const priorities = readPriorities(vaultDir);
  return Object.entries(priorities)
    .filter(([, p]) => p === priority)
    .map(([k]) => k);
}

export function renamePriorityKey(vaultDir: string, oldKey: string, newKey: string): void {
  const priorities = readPriorities(vaultDir);
  if (oldKey in priorities) {
    priorities[newKey] = priorities[oldKey];
    delete priorities[oldKey];
    writePriorities(vaultDir, priorities);
  }
}
