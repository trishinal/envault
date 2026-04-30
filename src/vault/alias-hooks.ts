import * as path from 'path';
import { getVaultPath } from './store';
import { readAliases } from '../cli/commands/alias';

/**
 * Resolves a key or alias to the canonical vault key.
 * Falls back to the input if no alias is found.
 */
export function resolveKey(keyOrAlias: string): string {
  try {
    const vaultDir = path.dirname(getVaultPath());
    const aliases = readAliases(vaultDir);
    return aliases[keyOrAlias] ?? keyOrAlias;
  } catch {
    return keyOrAlias;
  }
}

/**
 * Returns all aliases that point to the given canonical key.
 */
export function getAliasesForKey(canonicalKey: string): string[] {
  try {
    const vaultDir = path.dirname(getVaultPath());
    const aliases = readAliases(vaultDir);
    return Object.entries(aliases)
      .filter(([, target]) => target === canonicalKey)
      .map(([alias]) => alias);
  } catch {
    return [];
  }
}

/**
 * Returns a display label: "alias (KEY)" if an alias exists, otherwise just KEY.
 */
export function labelForKey(canonicalKey: string): string {
  const aliases = getAliasesForKey(canonicalKey);
  if (aliases.length === 0) return canonicalKey;
  return `${aliases[0]} (${canonicalKey})`;
}
