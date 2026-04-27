import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { encryptVault } from "../../crypto/index";

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-restore-"));
}

describe("restore command", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    vi.resetModules();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("restores vault from a backup file", async () => {
    const password = "restore-pass";
    const data = { RESTORE_KEY: "restore_value" };
    const encrypted = await encryptVault(data, password);

    const backupPath = path.join(tmpDir, "vault.backup");
    const vaultPath = path.join(tmpDir, ".envault");
    fs.writeFileSync(backupPath, encrypted, "utf-8");

    fs.copyFileSync(backupPath, vaultPath);
    expect(fs.existsSync(vaultPath)).toBe(true);

    const raw = fs.readFileSync(vaultPath, "utf-8");
    const { decryptVault } = await import("../../crypto/index");
    const result = await decryptVault(raw, password);
    expect(result["RESTORE_KEY"]).toBe("restore_value");
  });

  it("backup file contains valid encrypted data", async () => {
    const password = "test-pass";
    const data = { API_KEY: "abc123", DB_URL: "postgres://localhost" };
    const encrypted = await encryptVault(data, password);

    const backupPath = path.join(tmpDir, "vault.backup");
    fs.writeFileSync(backupPath, encrypted, "utf-8");

    const raw = fs.readFileSync(backupPath, "utf-8");
    const { decryptVault } = await import("../../crypto/index");
    const result = await decryptVault(raw, password);

    expect(result["API_KEY"]).toBe("abc123");
    expect(result["DB_URL"]).toBe("postgres://localhost");
  });

  it("fails to decrypt backup with wrong password", async () => {
    const password = "correct-pass";
    const data = { SECRET: "value" };
    const encrypted = await encryptVault(data, password);

    const backupPath = path.join(tmpDir, "vault.backup");
    fs.writeFileSync(backupPath, encrypted, "utf-8");

    const raw = fs.readFileSync(backupPath, "utf-8");
    const { decryptVault } = await import("../../crypto/index");
    await expect(decryptVault(raw, "wrong-pass")).rejects.toThrow();
  });
});
