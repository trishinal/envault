import fs from "fs";
import os from "os";
import path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptVault, decryptVault } from "../../crypto/index";
import { initVault, getVaultPath } from "../../vault/store";
import { setEntry } from "../../vault/entries";
import { pruneExpiredEntries } from "./prune";

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-prune-"));
}

async function makeVaultWithEntries(dir: string, password: string) {
  const vault = initVault();

  setEntry(vault, "ACTIVE_KEY", "active_value");

  // expired entry
  setEntry(vault, "EXPIRED_KEY", "expired_value");
  vault.entries["EXPIRED_KEY"].expiresAt = Date.now() - 1000;

  // future expiry
  setEntry(vault, "FUTURE_KEY", "future_value");
  vault.entries["FUTURE_KEY"].expiresAt = Date.now() + 60_000;

  const encrypted = await encryptVault(vault, password);
  fs.writeFileSync(getVaultPath(dir), encrypted, "utf-8");
  return vault;
}

describe("pruneExpiredEntries", () => {
  let tmpDir: string;
  const password = "test-password";

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("removes only expired entries", async () => {
    await makeVaultWithEntries(tmpDir, password);
    const removed = await pruneExpiredEntries(password, { vaultDir: tmpDir });

    expect(removed).toEqual(["EXPIRED_KEY"]);

    const encrypted = fs.readFileSync(getVaultPath(tmpDir), "utf-8");
    const vault = await decryptVault(encrypted, password);
    expect(vault.entries["ACTIVE_KEY"]).toBeDefined();
    expect(vault.entries["FUTURE_KEY"]).toBeDefined();
    expect(vault.entries["EXPIRED_KEY"]).toBeUndefined();
  });

  it("returns empty array when no entries are expired", async () => {
    const vault = initVault();
    setEntry(vault, "KEY", "value");
    const encrypted = await encryptVault(vault, password);
    fs.writeFileSync(getVaultPath(tmpDir), encrypted, "utf-8");

    const removed = await pruneExpiredEntries(password, { vaultDir: tmpDir });
    expect(removed).toHaveLength(0);
  });

  it("dry-run does not modify vault", async () => {
    await makeVaultWithEntries(tmpDir, password);
    const before = fs.readFileSync(getVaultPath(tmpDir), "utf-8");

    const removed = await pruneExpiredEntries(password, { vaultDir: tmpDir, dryRun: true });
    expect(removed).toEqual(["EXPIRED_KEY"]);

    const after = fs.readFileSync(getVaultPath(tmpDir), "utf-8");
    expect(after).toBe(before);
  });

  it("throws if vault does not exist", async () => {
    await expect(
      pruneExpiredEntries(password, { vaultDir: tmpDir })
    ).rejects.toThrow("No vault found");
  });

  it("throws on wrong password", async () => {
    await makeVaultWithEntries(tmpDir, password);
    await expect(
      pruneExpiredEntries("wrong-password", { vaultDir: tmpDir })
    ).rejects.toThrow();
  });
});
