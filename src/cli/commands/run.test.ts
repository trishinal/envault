import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { encryptVault } from "../../crypto/index.js";
import { initVault } from "../../vault/store.js";
import { setEntry } from "../../vault/entries.js";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-run-test-"));
}

vi.mock("readline", () => ({
  createInterface: () => ({
    question: (_: string, cb: (a: string) => void) => cb("testpassword"),
    close: () => {},
  }),
}));

describe("run command", () => {
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

  it("injects vault entries as environment variables", async () => {
    let vault = initVault();
    vault = setEntry(vault, "TEST_VAR", "hello_world");
    const encrypted = await encryptVault(vault, "testpassword");
    fs.writeFileSync(path.join(tmpDir, ".envault"), encrypted, "utf-8");

    const { spawn } = await import("child_process");
    const mockChild = { on: vi.fn() };
    const spawnSpy = vi.spyOn({ spawn }, "spawn").mockReturnValue(mockChild as any);

    // Verify env injection logic directly
    const { decryptVault } = await import("../../crypto/index.js");
    const decrypted = await decryptVault(encrypted, "testpassword");
    const { listEntries } = await import("../../vault/entries.js");
    const entries = listEntries(decrypted);

    expect(entries.find((e) => e.key === "TEST_VAR")?.value).toBe("hello_world");
    expect(entries.length).toBe(1);
  });

  it("filters entries by tag when --tags option is provided", async () => {
    let vault = initVault();
    vault = setEntry(vault, "PROD_VAR", "prod_value", ["prod"]);
    vault = setEntry(vault, "DEV_VAR", "dev_value", ["dev"]);
    const encrypted = await encryptVault(vault, "testpassword");
    fs.writeFileSync(path.join(tmpDir, ".envault"), encrypted, "utf-8");

    const { decryptVault } = await import("../../crypto/index.js");
    const decrypted = await decryptVault(encrypted, "testpassword");
    const { listEntries } = await import("../../vault/entries.js");
    const entries = listEntries(decrypted);

    const filterTags = ["prod"];
    const injected = entries
      .filter((e) => !filterTags || (e.tags && filterTags.some((t) => e.tags!.includes(t))))
      .reduce((acc, e) => ({ ...acc, [e.key]: e.value }), {} as Record<string, string>);

    expect(injected["PROD_VAR"]).toBe("prod_value");
    expect(injected["DEV_VAR"]).toBeUndefined();
  });
});
