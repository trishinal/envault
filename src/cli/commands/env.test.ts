import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { formatEnvLine } from './env.js';
import { encryptVault } from '../../crypto/index.js';
import { initVault } from '../../vault/store.js';
import { setEntry } from '../../vault/entries.js';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-env-test-'));
}

describe('formatEnvLine', () => {
  it('formats a simple key=value', () => {
    expect(formatEnvLine('FOO', 'bar')).toBe('FOO=bar');
  });

  it('quotes values with spaces', () => {
    expect(formatEnvLine('FOO', 'hello world')).toBe('FOO="hello world"');
  });

  it('quotes values with special characters', () => {
    expect(formatEnvLine('FOO', 'val#comment')).toBe('FOO="val#comment"');
  });

  it('escapes double quotes inside value', () => {
    expect(formatEnvLine('FOO', 'say "hi"')).toBe('FOO="say \\"hi\\""');
  });

  it('handles empty value', () => {
    expect(formatEnvLine('FOO', '')).toBe('FOO=');
  });
});

describe('env command integration', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates vault entries and verifies formatting', async () => {
    const password = 'testpass';
    let vault = initVault();
    vault = setEntry(vault, 'API_KEY', 'abc123');
    vault = setEntry(vault, 'DB_URL', 'postgres://localhost/db');

    const encrypted = await encryptVault(vault, password);
    fs.writeFileSync(path.join(tmpDir, '.envault'), encrypted);

    expect(formatEnvLine('API_KEY', 'abc123')).toBe('API_KEY=abc123');
    expect(formatEnvLine('DB_URL', 'postgres://localhost/db')).toBe('DB_URL=postgres://localhost/db');
  });

  it('formats value with spaces using quotes', () => {
    expect(formatEnvLine('GREETING', 'hello world')).toBe('GREETING="hello world"');
  });
});
