import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { auditEntries } from "./audit.js";

describe("auditEntries", () => {
  it("returns no issues for healthy entries", () => {
    const entries = {
      DATABASE_URL: "postgres://user:strongpassword123@localhost/db",
      API_KEY: "supersecretapikey12345678",
      PORT: "3000",
    };
    const results = auditEntries(entries);
    expect(results).toHaveLength(0);
  });

  it("flags empty values", () => {
    const entries = { EMPTY_VAR: "" };
    const results = auditEntries(entries);
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe("EMPTY_VAR");
    expect(results[0].issues).toContain("empty value");
  });

  it("flags values that are too short", () => {
    const entries = { SHORT: "abc" };
    const results = auditEntries(entries);
    expect(results[0].issues).toContain("value too short (< 8 chars)");
  });

  it("flags sensitive keys with weak values", () => {
    const entries = { API_SECRET: "short" };
    const results = auditEntries(entries);
    const issues = results[0].issues;
    expect(issues.some((i) => i.includes("sensitive key"))).toBe(true);
  });

  it("flags lowercase key names", () => {
    const entries = { my_var: "somevalue123" };
    const results = auditEntries(entries);
    expect(results[0].issues).toContain("key is not uppercase");
  });

  it("can flag multiple issues on the same key", () => {
    const entries = { secret: "" };
    const results = auditEntries(entries);
    expect(results[0].issues.length).toBeGreaterThan(1);
  });

  it("handles empty entries object", () => {
    const results = auditEntries({});
    expect(results).toHaveLength(0);
  });
});
