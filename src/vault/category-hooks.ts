import * as fs from 'fs';
import * as path from 'path';

export interface CategoryMap {
  [key: string]: string;
}

export function getCategoryFilePath(vaultDir: string): string {
  return path.join(vaultDir, '.categories.json');
}

export function readCategories(vaultDir: string): CategoryMap {
  const filePath = getCategoryFilePath(vaultDir);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

export function writeCategories(vaultDir: string, categories: CategoryMap): void {
  const filePath = getCategoryFilePath(vaultDir);
  fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), 'utf-8');
}

export function setCategoryForKey(vaultDir: string, key: string, category: string): void {
  const categories = readCategories(vaultDir);
  categories[key] = category;
  writeCategories(vaultDir, categories);
}

export function getCategoryForKey(vaultDir: string, key: string): string | undefined {
  return readCategories(vaultDir)[key];
}

export function clearCategoryForKey(vaultDir: string, key: string): void {
  const categories = readCategories(vaultDir);
  delete categories[key];
  writeCategories(vaultDir, categories);
}

export function getKeysInCategory(vaultDir: string, category: string): string[] {
  const categories = readCategories(vaultDir);
  return Object.entries(categories)
    .filter(([, cat]) => cat === category)
    .map(([key]) => key);
}

export function listCategories(vaultDir: string): string[] {
  const categories = readCategories(vaultDir);
  return [...new Set(Object.values(categories))].sort();
}

export function renameCategoryKey(vaultDir: string, oldKey: string, newKey: string): void {
  const categories = readCategories(vaultDir);
  if (oldKey in categories) {
    categories[newKey] = categories[oldKey];
    delete categories[oldKey];
    writeCategories(vaultDir, categories);
  }
}
