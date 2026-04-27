import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { grepEntries } from './grep.js';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-grep-'));
}

describe('grepEntries', () => {
  const entries = {
    DATABASE_URL: 'postgres://localhost:5432/mydb',
    REDIS_URL: 'redis://localhost:6379',
    API_KEY: 'supersecret123',
    APP_NAME: 'envault',
    DEBUG: 'false',
  };

  it('matches keys by pattern', () => {
    const results = grepEntries(entries, 'URL', { keys: true, values: false });
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.key)).toContain('DATABASE_URL');
    expect(results.map((r) => r.key)).toContain('REDIS_URL');
    expect(results.every((r) => r.matchedIn === 'key')).toBe(true);
  });

  it('matches values by pattern', () => {
    const results = grepEntries(entries, 'localhost', { keys: false, values: true });
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.key)).toContain('DATABASE_URL');
    expect(results.map((r) => r.key)).toContain('REDIS_URL');
    expect(results.every((r) => r.matchedIn === 'value')).toBe(true);
  });

  it('matches both keys and values', () => {
    const results = grepEntries(entries, 'envault', { keys: true, values: true });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('APP_NAME');
    expect(results[0].matchedIn).toBe('value');
  });

  it('reports matchedIn as both when pattern matches key and value', () => {
    const mixed = { REDIS: 'redis://redis:6379' };
    const results = grepEntries(mixed, 'redis', { keys: true, values: true, ignoreCase: true });
    expect(results).toHaveLength(1);
    expect(results[0].matchedIn).toBe('both');
  });

  it('is case-insensitive when ignoreCase is true', () => {
    const results = grepEntries(entries, 'database', { keys: true, values: false, ignoreCase: true });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('DATABASE_URL');
  });

  it('is case-sensitive by default', () => {
    const results = grepEntries(entries, 'database', { keys: true, values: false, ignoreCase: false });
    expect(results).toHaveLength(0);
  });

  it('returns empty array when no matches', () => {
    const results = grepEntries(entries, 'NONEXISTENT_PATTERN_XYZ', { keys: true, values: true });
    expect(results).toHaveLength(0);
  });

  it('supports regex patterns', () => {
    const results = grepEntries(entries, '^(DATABASE|REDIS)_URL$', { keys: true, values: false });
    expect(results).toHaveLength(2);
  });
});
