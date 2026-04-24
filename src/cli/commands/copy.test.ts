import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { copyCommand } from "./copy";
import { encryptVault, decryptVault } from "../../crypto";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-copy-test-"));
}

async function makeVault(
  dir: string,
  entries: Record<string, string>,
  password: string
): Promise<string> {
  const vaultPath = path.join(dir, ".envault");
  const encrypted = await encryptVault(entries, password);
  fs.writeFileSync(vaultPath, encrypted, "utf-8");
  return vaultPath;
}

describe("copyCommand", () => {
  const password = "test-password";

  it("copies an existing key to a new key", async () => {
    const dir = makeTempDir();
    const vaultPath = await makeVault(dir, { FOO: "bar" }, password);

    await copyCommand("FOO", "FOO_COPY", { vaultPath, password });

    const raw = fs.readFileSync(vaultPath, "utf-8");
    const vault = await decryptVault(raw, password);
    expect(vault["FOO"]).toBe("bar");
    expect(vault["FOO_COPY"]).toBe("bar");
  });

  it("exits if source key does not exist", async () => {
    const dir = makeTempDir();
    const vaultPath = await makeVault(dir, { FOO: "bar" }, password);
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });

    await expect(
      copyCommand("MISSING", "DEST", { vaultPath, password })
    ).rejects.toThrow("exit");

    mockExit.mockRestore();
  });

  it("exits if dest key exists without --overwrite", async () => {
    const dir = makeTempDir();
    const vaultPath = await makeVault(dir, { FOO: "bar", BAZ: "qux" }, password);
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });

    await expect(
      copyCommand("FOO", "BAZ", { vaultPath, password })
    ).rejects.toThrow("exit");

    mockExit.mockRestore();
  });

  it("overwrites dest key when --overwrite is set", async () => {
    const dir = makeTempDir();
    const vaultPath = await makeVault(dir, { FOO: "bar", BAZ: "old" }, password);

    await copyCommand("FOO", "BAZ", { vaultPath, password, overwrite: true });

    const raw = fs.readFileSync(vaultPath, "utf-8");
    const vault = await decryptVault(raw, password);
    expect(vault["BAZ"]).toBe("bar");
  });
});
