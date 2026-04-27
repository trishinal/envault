import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { encryptVault } from "../../crypto/index";
import { mergeVaults, MergeStrategy } from "./merge";

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-merge-"));
}

async function makeVaultFile(dir: string, name: string, data: Record<string, string>, password: string) {
  const encrypted = await encryptVault(data, password);
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, encrypted, "utf-8");
  return filePath;
}

describe("mergeVaults", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("adds new keys from source not in target", async () => {
    const target = { KEY_A: "val_a" };
    const source = { KEY_B: "val_b" };
    const result = await mergeVaults("", "", target, source, "ours");
    expect(result["KEY_A"]).toBe("val_a");
    expect(result["KEY_B"]).toBe("val_b");
  });

  it("strategy=ours keeps target value on conflict", async () => {
    const target = { KEY_A: "original" };
    const source = { KEY_A: "override" };
    const result = await mergeVaults("", "", target, source, "ours");
    expect(result["KEY_A"]).toBe("original");
  });

  it("strategy=theirs uses source value on conflict", async () => {
    const target = { KEY_A: "original" };
    const source = { KEY_A: "override" };
    const result = await mergeVaults("", "", target, source, "theirs");
    expect(result["KEY_A"]).toBe("override");
  });

  it("merges non-conflicting keys from both vaults", async () => {
    const target = { A: "1", B: "2" };
    const source = { C: "3", D: "4" };
    const result = await mergeVaults("", "", target, source, "ours");
    expect(Object.keys(result)).toHaveLength(4);
    expect(result["A"]).toBe("1");
    expect(result["C"]).toBe("3");
  });

  it("returns target unchanged when source is empty", async () => {
    const target = { KEY_A: "val_a" };
    const source = {};
    const result = await mergeVaults("", "", target, source, "theirs");
    expect(result).toEqual(target);
  });

  it("returns all source keys when target is empty", async () => {
    const target = {};
    const source = { KEY_X: "x", KEY_Y: "y" };
    const result = await mergeVaults("", "", target, source, "ours");
    expect(result).toEqual(source);
  });
});
