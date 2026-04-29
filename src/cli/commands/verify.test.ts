import fs from "fs";
import os from "os";
import path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initVault } from "../../vault/store";
import { setEntry } from "../../vault/entries";
import { verifyVaultPassword } from "./verify";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-verify-"));
}

describe("verifyVaultPassword", () => {
  let tmpDir: string;
  const password = "correct-horse-battery";

  beforeEach(async () => {
    tmpDir = makeTempDir();
    await initVault(tmpDir, password);
    await setEntry(tmpDir, password, "KEY", "value");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns true for the correct password", async () => {
    const result = await verifyVaultPassword(tmpDir, password);
    expect(result).toBe(true);
  });

  it("returns false for an incorrect password", async () => {
    const result = await verifyVaultPassword(tmpDir, "wrong-password");
    expect(result).toBe(false);
  });

  it("returns false for an empty password when vault was created with a real password", async () => {
    const result = await verifyVaultPassword(tmpDir, "");
    expect(result).toBe(false);
  });

  it("returns true when vault was created with an empty password and empty password is given", async () => {
    const emptyDir = makeTempDir();
    try {
      await initVault(emptyDir, "");
      const result = await verifyVaultPassword(emptyDir, "");
      expect(result).toBe(true);
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });
});
