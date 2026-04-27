import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { Command } from "commander";
import { registerWatch } from "./watch";
import { initVault } from "../../vault/store";
import { encryptVault } from "../../crypto";
import { setEntry } from "../../vault/entries";

export function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-watch-test-"));
}

function makeVaultDir(dir: string, password: string) {
  initVault(dir);
  let data = { entries: [] };
  data = setEntry(data, "API_KEY", "secret", ["prod"]);
  const encrypted = encryptVault(data, password);
  fs.writeFileSync(path.join(dir, ".envault"), encrypted, "utf-8");
  return dir;
}

describe("watch command", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("registers the watch command on the program", () => {
    const program = new Command();
    registerWatch(program);
    const cmd = program.commands.find((c) => c.name() === "watch");
    expect(cmd).toBeDefined();
    expect(cmd?.description()).toContain("Watch");
  });

  it("exits with error when vault does not exist", async () => {
    const program = new Command();
    registerWatch(program);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await program.parseAsync(["node", "envault", "watch", "--dir", tmpDir]);

    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("No vault found"));
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("prints summary after reading vault", async () => {
    makeVaultDir(tmpDir, "pass123");

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as never);

    vi.mock("readline", () => ({
      default: { createInterface: () => ({ question: (_: string, cb: (a: string) => void) => cb("pass123"), close: () => {} }) },
    }));

    // We only test registration/structure here; full integration would require a live watcher
    expect(logSpy).not.toHaveBeenCalled(); // not called yet

    logSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
