import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { diffVaults } from "./diff";
import { encryptVault } from "../../crypto/index";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-diff-test-"));
}

describe("diffVaults", () => {
  it("returns empty diff for identical vaults", () => {
    const entries = { FOO: "bar", BAZ: "qux" };
    const result = diffVaults(entries, { ...entries });
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.changed).toEqual([]);
  });

  it("detects added keys", () => {
    const a = { FOO: "bar" };
    const b = { FOO: "bar", NEW_KEY: "value" };
    const result = diffVaults(a, b);
    expect(result.added).toContain("NEW_KEY");
    expect(result.removed).toEqual([]);
    expect(result.changed).toEqual([]);
  });

  it("detects removed keys", () => {
    const a = { FOO: "bar", OLD_KEY: "value" };
    const b = { FOO: "bar" };
    const result = diffVaults(a, b);
    expect(result.removed).toContain("OLD_KEY");
    expect(result.added).toEqual([]);
    expect(result.changed).toEqual([]);
  });

  it("detects changed values", () => {
    const a = { FOO: "old" };
    const b = { FOO: "new" };
    const result = diffVaults(a, b);
    expect(result.changed).toContain("FOO");
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  it("handles all diff types simultaneously", () => {
    const a = { KEEP: "same", REMOVE: "gone", CHANGE: "old" };
    const b = { KEEP: "same", ADD: "new", CHANGE: "new" };
    const result = diffVaults(a, b);
    expect(result.added).toContain("ADD");
    expect(result.removed).toContain("REMOVE");
    expect(result.changed).toContain("CHANGE");
    expect(result.added).not.toContain("KEEP");
    expect(result.removed).not.toContain("KEEP");
    expect(result.changed).not.toContain("KEEP");
  });

  it("returns empty diff for two empty vaults", () => {
    const result = diffVaults({}, {});
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.changed).toEqual([]);
  });
});
