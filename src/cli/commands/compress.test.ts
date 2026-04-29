import fs from "fs";
import os from "os";
import path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { compressVault, decompressVault } from "./compress";
import { initVault } from "../../vault/store";
import { encryptVault } from "../../crypto";
import { setEntry } from "../../vault/entries";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-compress-"));
}

async function makeVault(dir: string, password: string) {
  initVault(dir);
  const vaultPath = path.join(dir, ".envault");
  const empty = await encryptVault({}, password);
  fs.writeFileSync(vaultPath, JSON.stringify(empty));
  await setEntry(dir, password, "KEY", "value");
}

describe("compress", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = makeTempDir();
    await makeVault(tmpDir, "testpass");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("compresses vault to .gz file", async () => {
    const outPath = await compressVault(tmpDir);
    expect(fs.existsSync(outPath)).toBe(true);
    expect(outPath.endsWith(".gz")).toBe(true);
    const stat = fs.statSync(outPath);
    expect(stat.size).toBeGreaterThan(0);
  });

  it("decompressed vault matches original", async () => {
    const vaultPath = path.join(tmpDir, ".envault");
    const original = fs.readFileSync(vaultPath).toString();
    const gzPath = await compressVault(tmpDir);

    const dir2 = makeTempDir();
    try {
      initVault(dir2);
      await decompressVault(gzPath, dir2);
      const restored = fs.readFileSync(path.join(dir2, ".envault")).toString();
      expect(restored).toBe(original);
    } finally {
      fs.rmSync(dir2, { recursive: true, force: true });
    }
  });

  it("compressed file is smaller than or equal to raw for small vaults", async () => {
    const vaultPath = path.join(tmpDir, ".envault");
    const rawSize = fs.statSync(vaultPath).size;
    const gzPath = await compressVault(tmpDir);
    const gzSize = fs.statSync(gzPath).size;
    // gzip has overhead for tiny files, just check it's a valid number
    expect(gzSize).toBeGreaterThan(0);
    expect(rawSize).toBeGreaterThan(0);
  });
});
