import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, expect, beforeEach } from "vitest";
import { initVault } from "../../vault/store";
import { setEntry } from "../../vault/entries";
import { getPinFilePath, readPins, writePins } from "./pin";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-pin-test-"));
}

async function makeVault(dir: string, password = "testpass") {
  await initVault(dir, password);
  await setEntry(dir, password, "API_KEY", "abc123");
  await setEntry(dir, password, "DB_URL", "postgres://localhost/dev");
  await setEntry(dir, password, "SECRET", "topsecret");
}

describe("getPinFilePath", () => {
  it("returns the correct path", () => {
    const dir = "/some/dir";
    expect(getPinFilePath(dir)).toBe(path.join(dir, ".envault-pins"));
  });
});

describe("readPins / writePins", () => {
  let dir: string;

  beforeEach(async () => {
    dir = makeTempDir();
    await makeVault(dir);
  });

  it("returns empty array when no pin file exists", () => {
    expect(readPins(dir)).toEqual([]);
  });

  it("writes and reads pins correctly", () => {
    writePins(dir, ["API_KEY", "DB_URL"]);
    const pins = readPins(dir);
    expect(pins).toContain("API_KEY");
    expect(pins).toContain("DB_URL");
    expect(pins).toHaveLength(2);
  });

  it("overwrites existing pins on write", () => {
    writePins(dir, ["API_KEY", "DB_URL"]);
    writePins(dir, ["SECRET"]);
    expect(readPins(dir)).toEqual(["SECRET"]);
  });

  it("writes an empty pin file when pins array is empty", () => {
    writePins(dir, ["API_KEY"]);
    writePins(dir, []);
    expect(readPins(dir)).toEqual([]);
  });

  it("pin file exists after writing", () => {
    writePins(dir, ["API_KEY"]);
    expect(fs.existsSync(getPinFilePath(dir))).toBe(true);
  });

  it("does not duplicate pins on multiple writes", () => {
    writePins(dir, ["API_KEY"]);
    const existing = readPins(dir);
    if (!existing.includes("API_KEY")) {
      writePins(dir, [...existing, "API_KEY"]);
    }
    expect(readPins(dir).filter((p) => p === "API_KEY")).toHaveLength(1);
  });
});
