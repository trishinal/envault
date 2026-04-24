import { VaultData } from './store';

export function setEntry(
  vault: VaultData,
  key: string,
  value: string
): VaultData {
  if (!isValidKey(key)) {
    throw new Error(`Invalid key: "${key}". Keys must be alphanumeric with underscores.`);
  }
  return {
    ...vault,
    entries: { ...vault.entries, [key]: value },
  };
}

export function getEntry(
  vault: VaultData,
  key: string
): string | undefined {
  return vault.entries[key];
}

export function deleteEntry(
  vault: VaultData,
  key: string
): VaultData {
  const entries = { ...vault.entries };
  delete entries[key];
  return { ...vault, entries };
}

export function listEntries(
  vault: VaultData
): Array<{ key: string; value: string }> {
  return Object.entries(vault.entries).map(([key, value]) => ({ key, value }));
}

export function hasEntry(vault: VaultData, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(vault.entries, key);
}

export function mergeEntries(
  vault: VaultData,
  incoming: Record<string, string>,
  overwrite = false
): VaultData {
  const merged = { ...vault.entries };
  for (const [key, value] of Object.entries(incoming)) {
    if (!hasEntry(vault, key) || overwrite) {
      merged[key] = value;
    }
  }
  return { ...vault, entries: merged };
}

function isValidKey(key: string): boolean {
  return /^[A-Z_][A-Z0-9_]*$/i.test(key);
}
