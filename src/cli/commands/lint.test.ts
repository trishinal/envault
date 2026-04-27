import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { lintEntries, LintResult } from './lint';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-lint-'));
}

describe('lintEntries', () => {
  it('returns no issues for clean entries', () => {
    const entries = { API_KEY: 'abc123', DB_URL: 'postgres://localhost/db' };
    const results = lintEntries(entries);
    expect(results).toHaveLength(0);
  });

  it('warns about lowercase keys', () => {
    const entries = { api_key: 'abc123' };
    const results = lintEntries(entries);
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('api_key');
    expect(results[0].warnings).toContain('Key should be UPPER_SNAKE_CASE');
  });

  it('warns about empty values', () => {
    const entries = { API_KEY: '' };
    const results = lintEntries(entries);
    expect(results[0].warnings).toContain('Value is empty or whitespace only');
  });

  it('warns about whitespace-only values', () => {
    const entries = { API_KEY: '   ' };
    const results = lintEntries(entries);
    expect(results[0].warnings).toContain('Value is empty or whitespace only');
  });

  it('warns about values exceeding 4096 chars', () => {
    const entries = { API_KEY: 'x'.repeat(4097) };
    const results = lintEntries(entries);
    expect(results[0].warnings).toContain('Value is unusually long (>4096 chars)');
  });

  it('warns about unquoted whitespace in value', () => {
    const entries = { APP_NAME: 'my app' };
    const results = lintEntries(entries);
    expect(results[0].warnings).toContain('Value contains whitespace but is not quoted');
  });

  it('does not warn about quoted whitespace in value', () => {
    const entries = { APP_NAME: '"my app"' };
    const results = lintEntries(entries);
    expect(results).toHaveLength(0);
  });

  it('can report multiple warnings for a single key', () => {
    const entries = { badkey: '' };
    const results = lintEntries(entries);
    expect(results[0].warnings.length).toBeGreaterThanOrEqual(2);
  });

  it('handles multiple entries with mixed results', () => {
    const entries = { GOOD_KEY: 'value', bad_key: '', ANOTHER: 'ok' };
    const results = lintEntries(entries);
    expect(results).toHaveLength(2);
    const keys = results.map((r: LintResult) => r.key);
    expect(keys).toContain('bad_key');
  });
});
