import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { renderTemplate } from './template.js';
import { encryptVault } from '../../crypto/index.js';
import { initVault } from '../../vault/store.js';
import { setEntry } from '../../vault/entries.js';

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'envault-template-test-'));
}

describe('renderTemplate', () => {
  it('replaces known placeholders with entry values', () => {
    const template = 'DB_HOST={{ DB_HOST }} DB_PORT={{ DB_PORT }}';
    const entries = { DB_HOST: 'localhost', DB_PORT: '5432' };
    const result = renderTemplate(template, entries);
    expect(result).toBe('DB_HOST=localhost DB_PORT=5432');
  });

  it('leaves unknown placeholders unchanged', () => {
    const template = 'API_KEY={{ API_KEY }} UNKNOWN={{ UNKNOWN_KEY }}';
    const entries = { API_KEY: 'secret123' };
    const result = renderTemplate(template, entries);
    expect(result).toBe('API_KEY=secret123 UNKNOWN={{ UNKNOWN_KEY }}');
  });

  it('handles whitespace inside placeholders', () => {
    const template = 'HOST={{  HOST  }}';
    const entries = { HOST: 'example.com' };
    const result = renderTemplate(template, entries);
    expect(result).toBe('HOST=example.com');
  });

  it('returns template unchanged when entries are empty', () => {
    const template = 'VALUE={{ SOME_KEY }}';
    const result = renderTemplate(template, {});
    expect(result).toBe('VALUE={{ SOME_KEY }}');
  });

  it('handles multiline templates', () => {
    const template = 'DB={{ DB }}\nPORT={{ PORT }}\n';
    const entries = { DB: 'mydb', PORT: '3306' };
    const result = renderTemplate(template, entries);
    expect(result).toBe('DB=mydb\nPORT=3306\n');
  });
});

describe('template file rendering integration', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('renders a template file using vault entries', async () => {
    const password = 'testpass';
    let vault = initVault();
    vault = setEntry(vault, 'APP_NAME', 'envault');
    vault = setEntry(vault, 'VERSION', '1.0.0');

    const encrypted = await encryptVault(vault, password);
    const vaultPath = path.join(tmpDir, '.envault');
    await fs.writeFile(vaultPath, encrypted, 'utf-8');

    const templateContent = 'App: {{ APP_NAME }} v{{ VERSION }}';
    const templatePath = path.join(tmpDir, 'template.txt');
    await fs.writeFile(templatePath, templateContent, 'utf-8');

    const { decryptVault } = await import('../../crypto/index.js');
    const { listEntries } = await import('../../vault/entries.js');

    const encryptedContent = await fs.readFile(vaultPath, 'utf-8');
    const loadedVault = await decryptVault(encryptedContent, password);
    const entries = listEntries(loadedVault);
    const entryMap: Record<string, string> = {};
    for (const { key, value } of entries) entryMap[key] = value;

    const rendered = renderTemplate(templateContent, entryMap);
    expect(rendered).toBe('App: envault v1.0.0');
  });
});
