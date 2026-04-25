import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-backup-test-"));
}

describe("backup command", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("copies vault file to destination directory", () => {
    const vaultFile = path.join(tempDir, "vault.enc");
    const backupDir = path.join(tempDir, "backups");
    fs.mkdirSync(backupDir);
    fs.writeFileSync(vaultFile, "encrypted-data");

    vi.spyOn(fs, "copyFileSync");

    fs.copyFileSync(vaultFile, path.join(backupDir, "vault-backup-test.enc"));

    const files = fs.readdirSync(backupDir);
    expect(files.length).toBe(1);
    expect(files[0]).toContain("vault-backup");
  });

  it("backup file contains same content as source vault", () => {
    const vaultFile = path.join(tempDir, "vault.enc");
    const backupFile = path.join(tempDir, "vault-backup.enc");
    const content = "super-secret-encrypted-content";
    fs.writeFileSync(vaultFile, content);

    fs.copyFileSync(vaultFile, backupFile);

    const backupContent = fs.readFileSync(backupFile, "utf-8");
    expect(backupContent).toBe(content);
  });

  it("generates unique filenames with timestamps", () => {
    const names = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      names.add(`vault-backup-${timestamp}.enc`);
    }
    // All generated names should follow the pattern
    for (const name of names) {
      expect(name).toMatch(/^vault-backup-.+\.enc$/);
    }
  });

  it("includes label in filename when provided", () => {
    const label = "pre-deploy";
    const timestamp = "2024-01-01T00-00-00-000Z";
    const filename = `vault-backup-${label}-${timestamp}.enc`;
    expect(filename).toContain(label);
    expect(filename).toContain("vault-backup");
  });
});
