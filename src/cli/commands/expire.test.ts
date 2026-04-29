import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  parseDuration,
  getExpireFilePath,
  readExpire,
  writeExpire,
  isExpired,
  ExpireMap,
} from "./expire";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-expire-test-"));
}

describe("parseDuration", () => {
  it("parses days", () => {
    expect(parseDuration("7d")).toBe(7 * 86400000);
  });

  it("parses hours", () => {
    expect(parseDuration("24h")).toBe(24 * 3600000);
  });

  it("parses minutes", () => {
    expect(parseDuration("30m")).toBe(30 * 60000);
  });

  it("parses seconds", () => {
    expect(parseDuration("90s")).toBe(90 * 1000);
  });

  it("returns null for invalid input", () => {
    expect(parseDuration("abc")).toBeNull();
    expect(parseDuration("7")).toBeNull();
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("7x")).toBeNull();
  });
});

describe("isExpired", () => {
  it("returns true for past timestamps", () => {
    expect(isExpired(Date.now() - 1000)).toBe(true);
  });

  it("returns false for future timestamps", () => {
    expect(isExpired(Date.now() + 100000)).toBe(false);
  });
});

describe("readExpire / writeExpire", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns empty object when no expire file exists", () => {
    expect(readExpire(tmpDir)).toEqual({});
  });

  it("writes and reads expire data correctly", () => {
    const data: ExpireMap = { API_KEY: Date.now() + 86400000, DB_PASS: Date.now() - 1000 };
    writeExpire(tmpDir, data);
    const result = readExpire(tmpDir);
    expect(result).toEqual(data);
  });

  it("stores the expire file at expected path", () => {
    writeExpire(tmpDir, { FOO: 12345 });
    expect(fs.existsSync(getExpireFilePath(tmpDir))).toBe(true);
  });

  it("overwrites existing expire data", () => {
    writeExpire(tmpDir, { KEY1: 111 });
    writeExpire(tmpDir, { KEY2: 222 });
    expect(readExpire(tmpDir)).toEqual({ KEY2: 222 });
  });
});
