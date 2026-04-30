import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { initVault } from "../../vault/store";
import { encryptVault } from "../../crypto";
import { setEntry } from "../../vault/entries";
import { runDoctor } from "./doctor";

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-doctor-"));
}

describe("runDoctor", () => {
  let tmpDir: string;
  const password = "test-password";

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("reports missing vault", async () => {
    const result = await runDoctor(tmpDir, password);
    expect(result.vaultExists).toBe(false);
    expect(result.warnings).toContain("No vault found in directory.");
  });

  it("reports decryptable vault with correct password", async () => {
    initVault(tmpDir, password);
    const result = await runDoctor(tmpDir, password);
    expect(result.vaultExists).toBe(true);
    expect(result.vaultLocked).toBe(false);
    expect(result.decryptable).toBe(true);
    expect(result.warnings).not.toContain("Failed to decrypt vault. Wrong password?");
  });

  it("reports wrong password", async () => {
    initVault(tmpDir, password);
    const result = await runDoctor(tmpDir, "wrong-password");
    expect(result.decryptable).toBe(false);
    expect(result.warnings).toContain("Failed to decrypt vault. Wrong password?");
  });

  it("counts total keys correctly", async () => {
    initVault(tmpDir, password);
    const vaultPath = path.join(tmpDir, ".envault");
    const raw = fs.readFileSync(vaultPath, "utf-8");
    const { decryptVault, encryptVault } = await import("../../crypto");
    let data = decryptVault(raw, password);
    data = setEntry(data, "KEY1", "val1");
    data = setEntry(data, "KEY2", "val2");
    fs.writeFileSync(vaultPath, encryptVault(data, password));
    const result = await runDoctor(tmpDir, password);
    expect(result.totalKeys).toBe(2);
  });

  it("returns no warnings for a clean vault", async () => {
    initVault(tmpDir, password);
    const result = await runDoctor(tmpDir, password);
    expect(result.warnings).toHaveLength(0);
  });
});
