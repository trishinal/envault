import fs from 'fs';
import { getVaultPath } from './store';
import { readTtl, writeTtl, isTtlExpired, TtlMap } from '../cli/commands/ttl';

/**
 * Check whether a key is TTL-expired before reading it.
 * Returns true if the key should be blocked (expired), false otherwise.
 */
export function checkTtlBeforeRead(vaultDir: string, key: string): boolean {
  const ttl = readTtl(vaultDir);
  return isTtlExpired(ttl, key);
}

/**
 * Clear the TTL for a key (e.g. after it has been deleted or overwritten).
 */
export function clearTtlForKey(vaultDir: string, key: string): void {
  const ttl = readTtl(vaultDir);
  if (key in ttl) {
    delete ttl[key];
    writeTtl(vaultDir, ttl);
  }
}

/**
 * Return all keys in the vault that currently have an active (non-expired) TTL.
 */
export function getActiveTtlKeys(vaultDir: string): Array<{ key: string; expiresAt: Date; remainingMs: number }> {
  const ttl: TtlMap = readTtl(vaultDir);
  const now = Date.now();
  return Object.entries(ttl)
    .filter(([, exp]) => exp > now)
    .map(([key, exp]) => ({
      key,
      expiresAt: new Date(exp),
      remainingMs: exp - now,
    }))
    .sort((a, b) => a.remainingMs - b.remainingMs);
}

/**
 * Return all keys whose TTL has already passed.
 */
export function getExpiredTtlKeys(vaultDir: string): string[] {
  const ttl: TtlMap = readTtl(vaultDir);
  const now = Date.now();
  return Object.entries(ttl)
    .filter(([, exp]) => exp <= now)
    .map(([key]) => key);
}
