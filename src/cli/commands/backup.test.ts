import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { encryptVault } from "../../crypto/index";
import { getBackupPath } from "./backup";

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-backup-"));
}

describe("getBackupPath", () => {
  it("returns a path ending in .backup", () => {
    const vaultPath = "/home/user/.envault";
    const result = getBackupPath(vaultPath);
    expect(result).toMatch(/\.backup$/);
  });

  it("includes a timestamp in the backup path", () => {
    const vaultPath = "/home/user/.envault";
    const before = Date.now();
    const result = getBackupPath(vaultPath);
    const after = Date.now();
    const match = result.match(/(\d+)\.backup$/);
    expect(match).not.toBeNull();
    const ts = parseInt(match![1], 10);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

describe("backup command integration", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    vi.resetModules();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("creates a backup file with same encrypted content", async () => {
    const password = "backup-pass";
    const data = { BACKUP_KEY: "backup_value" };
    const encrypted = await encryptVault(data, password);

    const vaultPath = path.join(tmpDir, ".envault");
    fs.writeFileSync(vaultPath, encrypted, "utf-8");

    const backupPath = getBackupPath(vaultPath);
    fs.copyFileSync(vaultPath, backupPath);

    expect(fs.existsSync(backupPath)).toBe(true);
    const backupContent = fs.readFileSync(backupPath, "utf-8");
    expect(backupContent).toBe(encrypted);
  });

  it("backup can be decrypted with original password", async () => {
    const password = "secure-pass";
    const data = { ENV: "production", PORT: "3000" };
    const encrypted = await encryptVault(data, password);

    const vaultPath = path.join(tmpDir, ".envault");
    const backupPath = path.join(tmpDir, "vault.backup");
    fs.writeFileSync(vaultPath, encrypted, "utf-8");
    fs.copyFileSync(vaultPath, backupPath);

    const raw = fs.readFileSync(backupPath, "utf-8");
    const { decryptVault } = await import("../../crypto/index");
    const result = await decryptVault(raw, password);
    expect(result["ENV"]).toBe("production");
    expect(result["PORT"]).toBe("3000");
  });
});
