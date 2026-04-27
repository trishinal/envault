import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { getHistoryPath, readHistory, appendHistory, HistoryEntry } from "./history";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-history-test-"));
}

describe("history utilities", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns empty array when no history file exists", () => {
    const entries = readHistory(tmpDir);
    expect(entries).toEqual([]);
  });

  it("appends a history entry and reads it back", () => {
    const entry: HistoryEntry = {
      timestamp: new Date().toISOString(),
      action: "set",
      key: "API_KEY",
    };
    appendHistory(tmpDir, entry);
    const entries = readHistory(tmpDir);
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe("API_KEY");
    expect(entries[0].action).toBe("set");
  });

  it("appends multiple entries in order", () => {
    appendHistory(tmpDir, { timestamp: "2024-01-01T00:00:00Z", action: "set", key: "FOO" });
    appendHistory(tmpDir, { timestamp: "2024-01-02T00:00:00Z", action: "delete", key: "BAR" });
    const entries = readHistory(tmpDir);
    expect(entries).toHaveLength(2);
    expect(entries[0].key).toBe("FOO");
    expect(entries[1].key).toBe("BAR");
  });

  it("trims history to 500 entries", () => {
    for (let i = 0; i < 510; i++) {
      appendHistory(tmpDir, { timestamp: new Date().toISOString(), action: "set", key: `KEY_${i}` });
    }
    const entries = readHistory(tmpDir);
    expect(entries).toHaveLength(500);
    expect(entries[0].key).toBe("KEY_10");
  });

  it("getHistoryPath returns correct path", () => {
    const histPath = getHistoryPath(tmpDir);
    expect(histPath).toBe(path.join(tmpDir, ".envault_history.json"));
  });

  it("returns empty array if history file is malformed", () => {
    fs.writeFileSync(path.join(tmpDir, ".envault_history.json"), "not-json");
    const entries = readHistory(tmpDir);
    expect(entries).toEqual([]);
  });

  it("stores the 'by' field when provided", () => {
    appendHistory(tmpDir, { timestamp: "2024-01-01T00:00:00Z", action: "set", key: "SECRET", by: "alice" });
    const entries = readHistory(tmpDir);
    expect(entries[0].by).toBe("alice");
  });
});
