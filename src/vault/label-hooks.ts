import * as fs from 'fs';
import * as path from 'path';

export type LabelMap = Record<string, string[]>;

export function getLabelFilePath(vaultDir: string): string {
  return path.join(vaultDir, '.labels.json');
}

export function readLabels(vaultDir: string): LabelMap {
  const filePath = getLabelFilePath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

export function writeLabels(vaultDir: string, labels: LabelMap): void {
  const filePath = getLabelFilePath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(labels, null, 2), 'utf-8');
}

export function addLabelToKey(vaultDir: string, key: string, label: string): void {
  const labels = readLabels(vaultDir);
  if (!labels[key]) labels[key] = [];
  if (!labels[key].includes(label)) labels[key].push(label);
  writeLabels(vaultDir, labels);
}

export function removeLabelFromKey(vaultDir: string, key: string, label: string): void {
  const labels = readLabels(vaultDir);
  if (!labels[key]) return;
  labels[key] = labels[key].filter((l) => l !== label);
  if (labels[key].length === 0) delete labels[key];
  writeLabels(vaultDir, labels);
}

export function getLabelsForKey(vaultDir: string, key: string): string[] {
  return readLabels(vaultDir)[key] ?? [];
}

export function getKeysByLabel(vaultDir: string, label: string): string[] {
  const labels = readLabels(vaultDir);
  return Object.entries(labels)
    .filter(([, lbls]) => lbls.includes(label))
    .map(([k]) => k);
}

export function clearLabelsForKey(vaultDir: string, key: string): void {
  const labels = readLabels(vaultDir);
  delete labels[key];
  writeLabels(vaultDir, labels);
}

export function renameLabelKey(vaultDir: string, oldKey: string, newKey: string): void {
  const labels = readLabels(vaultDir);
  if (!labels[oldKey]) return;
  labels[newKey] = labels[oldKey];
  delete labels[oldKey];
  writeLabels(vaultDir, labels);
}
