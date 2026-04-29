import fs from "fs";
import path from "path";
import os from "os";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateSchema, getSchemaPath, SchemaEntry } from "./schema";
import { initVault } from "../../vault/store";
import { setEntry } from "../../vault/entries";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-schema-test-"));
}

async function makeVault(dir: string, password: string, entries: Record<string, string>) {
  await initVault(dir, password);
  for (const [key, value] of Object.entries(entries)) {
    await setEntry(dir, password, key, value);
  }
}

describe("generateSchema", () => {
  it("returns a schema entry for each key", () => {
    const entries = { API_KEY: "abc", DB_URL: "postgres://localhost" };
    const schema = generateSchema(entries);
    expect(schema).toHaveLength(2);
    expect(schema.map((e: SchemaEntry) => e.key)).toEqual(["API_KEY", "DB_URL"]);
  });

  it("marks all entries as required by default", () => {
    const schema = generateSchema({ FOO: "bar" });
    expect(schema[0].required).toBe(true);
  });

  it("returns empty array for empty vault", () => {
    expect(generateSchema({})).toEqual([]);
  });
});

describe("getSchemaPath", () => {
  it("returns path inside vault dir", () => {
    const p = getSchemaPath("/some/dir");
    expect(p).toBe("/some/dir/.envault-schema.json");
  });
});

describe("schema file integration", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes a valid schema JSON file", async () => {
    await makeVault(tmpDir, "secret", { NODE_ENV: "production", PORT: "3000" });
    const entries = { NODE_ENV: "production", PORT: "3000" };
    const schema = generateSchema(entries);
    const schemaPath = getSchemaPath(tmpDir);
    fs.writeFileSync(schemaPath, JSON.stringify({ entries: schema }, null, 2));
    expect(fs.existsSync(schemaPath)).toBe(true);
    const parsed = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.entries[0].key).toBe("NODE_ENV");
    expect(parsed.entries[1].key).toBe("PORT");
  });

  it("detects missing required keys during validation", async () => {
    const schema: SchemaEntry[] = [
      { key: "API_KEY", required: true },
      { key: "DB_URL", required: true },
    ];
    const vaultData = { API_KEY: "xyz" };
    const missing = schema.filter((e) => e.required && !(e.key in vaultData));
    expect(missing).toHaveLength(1);
    expect(missing[0].key).toBe("DB_URL");
  });

  it("passes validation when all required keys present", () => {
    const schema: SchemaEntry[] = [
      { key: "FOO", required: true },
      { key: "BAR", required: false },
    ];
    const vaultData = { FOO: "1" };
    const missing = schema.filter((e) => e.required && !(e.key in vaultData));
    expect(missing).toHaveLength(0);
  });
});
