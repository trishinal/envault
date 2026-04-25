import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { encryptVault } from "../../crypto";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-tags-test-"));
}

async function makeVault(dir: string, password: string) {
  const vaultPath = path.join(dir, ".envault");
  const data = {
    version: 1,
    entries: {
      DB_URL: { value: "postgres://localhost", tags: ["db", "infra"] },
      API_KEY: { value: "secret123", tags: [] },
    },
  };
  const encrypted = await encryptVault(data, password);
  fs.writeFileSync(vaultPath, encrypted, "utf-8");
  return vaultPath;
}

describe("tags command", () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("reads existing tags from an entry", async () => {
    const password = "testpass";
    await makeVault(tmpDir, password);
    const { decryptVault } = await import("../../crypto");
    const raw = fs.readFileSync(path.join(tmpDir, ".envault"), "utf-8");
    const data = await decryptVault(raw, password);
    expect(data.entries["DB_URL"].tags).toEqual(["db", "infra"]);
  });

  it("adds a tag to an entry", async () => {
    const password = "testpass";
    await makeVault(tmpDir, password);
    const { decryptVault, encryptVault } = await import("../../crypto");
    const vaultPath = path.join(tmpDir, ".envault");
    const raw = fs.readFileSync(vaultPath, "utf-8");
    const data = await decryptVault(raw, password);
    const entry = data.entries["API_KEY"];
    if (!entry.tags) entry.tags = [];
    entry.tags.push("auth");
    const encrypted = await encryptVault(data, password);
    fs.writeFileSync(vaultPath, encrypted, "utf-8");
    const raw2 = fs.readFileSync(vaultPath, "utf-8");
    const data2 = await decryptVault(raw2, password);
    expect(data2.entries["API_KEY"].tags).toContain("auth");
  });

  it("removes a tag from an entry", async () => {
    const password = "testpass";
    await makeVault(tmpDir, password);
    const { decryptVault, encryptVault } = await import("../../crypto");
    const vaultPath = path.join(tmpDir, ".envault");
    const raw = fs.readFileSync(vaultPath, "utf-8");
    const data = await decryptVault(raw, password);
    data.entries["DB_URL"].tags = data.entries["DB_URL"].tags.filter((t: string) => t !== "db");
    const encrypted = await encryptVault(data, password);
    fs.writeFileSync(vaultPath, encrypted, "utf-8");
    const raw2 = fs.readFileSync(vaultPath, "utf-8");
    const data2 = await decryptVault(raw2, password);
    expect(data2.entries["DB_URL"].tags).not.toContain("db");
    expect(data2.entries["DB_URL"].tags).toContain("infra");
  });

  it("does not duplicate tags", async () => {
    const password = "testpass";
    await makeVault(tmpDir, password);
    const { decryptVault, encryptVault } = await import("../../crypto");
    const vaultPath = path.join(tmpDir, ".envault");
    const raw = fs.readFileSync(vaultPath, "utf-8");
    const data = await decryptVault(raw, password);
    const entry = data.entries["DB_URL"];
    if (!entry.tags.includes("db")) entry.tags.push("db");
    const encrypted = await encryptVault(data, password);
    fs.writeFileSync(vaultPath, encrypted, "utf-8");
    const raw2 = fs.readFileSync(vaultPath, "utf-8");
    const data2 = await decryptVault(raw2, password);
    const dbTags = data2.entries["DB_URL"].tags.filter((t: string) => t === "db");
    expect(dbTags.length).toBe(1);
  });
});
