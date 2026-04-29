import fs from "fs";
import os from "os";
import path from "path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getSnapshotDir, getSnapshotPath } from "./snapshot.js";
import { initVault, getVaultPath } from "../../vault/store.js";
import { encryptVault, decryptVault } from "../../crypto/index.js";
import { setEntry } from "../../vault/entries.js";

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-snapshot-"));
}

async function makeVault(dir: string, password: string) {
  await initVault(dir, password);
  const vaultPath = getVaultPath(dir);
  const encrypted = fs.readFileSync(vaultPath, "utf-8");
  const entries = await decryptVault(encrypted, password);
  await setEntry(entries, "KEY", "value");
  const newEncrypted = await encryptVault(entries, password);
  fs.writeFileSync(vaultPath, newEncrypted, "utf-8");
}

describe("snapshot helpers", () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTempDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it("getSnapshotDir returns .snapshots inside vault dir", () => {
    expect(getSnapshotDir(tmpDir)).toBe(path.join(tmpDir, ".snapshots"));
  });

  it("getSnapshotPath sanitizes label", () => {
    const p = getSnapshotPath(tmpDir, "my label/bad");
    expect(p).toContain("my_label_bad.vault");
  });

  it("saves and restores snapshot content", async () => {
    const password = "testpass";
    await makeVault(tmpDir, password);

    const vaultPath = getVaultPath(tmpDir);
    const original = fs.readFileSync(vaultPath, "utf-8");

    // manually save snapshot
    const snapDir = getSnapshotDir(tmpDir);
    fs.mkdirSync(snapDir, { recursive: true });
    const snapPath = getSnapshotPath(tmpDir, "v1");
    fs.writeFileSync(snapPath, original, "utf-8");

    expect(fs.existsSync(snapPath)).toBe(true);

    // verify snapshot is valid vault
    const snapContent = fs.readFileSync(snapPath, "utf-8");
    const entries = await decryptVault(snapContent, password);
    expect(entries["KEY"]).toBe("value");
  });

  it("lists snapshot files", () => {
    const snapDir = getSnapshotDir(tmpDir);
    fs.mkdirSync(snapDir, { recursive: true });
    fs.writeFileSync(getSnapshotPath(tmpDir, "alpha"), "data", "utf-8");
    fs.writeFileSync(getSnapshotPath(tmpDir, "beta"), "data", "utf-8");
    const files = fs.readdirSync(snapDir).filter((f) => f.endsWith(".vault"));
    expect(files).toHaveLength(2);
    expect(files.map((f) => f.replace(/\.vault$/, "")).sort()).toEqual(["alpha", "beta"]);
  });

  it("deletes snapshot file", () => {
    const snapDir = getSnapshotDir(tmpDir);
    fs.mkdirSync(snapDir, { recursive: true });
    const snapPath = getSnapshotPath(tmpDir, "to-delete");
    fs.writeFileSync(snapPath, "data", "utf-8");
    expect(fs.existsSync(snapPath)).toBe(true);
    fs.unlinkSync(snapPath);
    expect(fs.existsSync(snapPath)).toBe(false);
  });
});
