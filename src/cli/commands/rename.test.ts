import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { renameCommand } from "./rename";
import { encryptVault, decryptVault } from "../../crypto";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-rename-test-"));
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

describe("renameCommand", () => {
  const password = "test-password";

  it("renames an existing key", async () => {
    const dir = makeTempDir();
    const vaultPath = await makeVault(dir, { OLD_KEY: "myvalue" }, password);

    await renameCommand("OLD_KEY", "NEW_KEY", { vaultPath, password });

    const raw = fs.readFileSync(vaultPath, "utf-8");
    const vault = await decryptVault(raw, password);
    expect(vault["NEW_KEY"]).toBe("myvalue");
    expect(vault["OLD_KEY"]).toBeUndefined();
  });

  it("exits if source key does not exist", async () => {
    const dir = makeTempDir();
    const vaultPath = await makeVault(dir, { FOO: "bar" }, password);
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });

    await expect(
      renameCommand("MISSING", "DEST", { vaultPath, password })
    ).rejects.toThrow("exit");

    mockExit.mockRestore();
  });

  it("exits if dest key exists without --overwrite", async () => {
    const dir = makeTempDir();
    const vaultPath = await makeVault(dir, { FOO: "bar", BAZ: "qux" }, password);
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });

    await expect(
      renameCommand("FOO", "BAZ", { vaultPath, password })
    ).rejects.toThrow("exit");

    mockExit.mockRestore();
  });

  it("overwrites dest key when --overwrite is set", async () => {
    const dir = makeTempDir();
    const vaultPath = await makeVault(dir, { FOO: "bar", BAZ: "old" }, password);

    await renameCommand("FOO", "BAZ", { vaultPath, password, overwrite: true });

    const raw = fs.readFileSync(vaultPath, "utf-8");
    const vault = await decryptVault(raw, password);
    expect(vault["BAZ"]).toBe("bar");
    expect(vault["FOO"]).toBeUndefined();
  });
});
