import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptVault, decryptVault } from "../../crypto/index";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-clone-test-"));
}

describe("clone command", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("clones a vault to a new path with the same password", async () => {
    const entries = { DB_URL: "postgres://localhost/dev", SECRET: "abc123" };
    const password = "testpass";
    const sourcePath = path.join(tmpDir, "source.vault");
    const destPath = path.join(tmpDir, "dest.vault");

    const ciphertext = await encryptVault(entries, password);
    fs.writeFileSync(sourcePath, ciphertext, "utf-8");

    const sourceCipher = fs.readFileSync(sourcePath, "utf-8");
    const decrypted = await decryptVault(sourceCipher, password);
    const clonedCipher = await encryptVault(decrypted, password);
    fs.writeFileSync(destPath, clonedCipher, "utf-8");

    expect(fs.existsSync(destPath)).toBe(true);
    const result = await decryptVault(fs.readFileSync(destPath, "utf-8"), password);
    expect(result).toEqual(entries);
  });

  it("clones a vault with a new password", async () => {
    const entries = { API_KEY: "key-xyz" };
    const sourcePassword = "oldpass";
    const newPassword = "newpass";
    const sourcePath = path.join(tmpDir, "source.vault");
    const destPath = path.join(tmpDir, "dest.vault");

    const ciphertext = await encryptVault(entries, sourcePassword);
    fs.writeFileSync(sourcePath, ciphertext, "utf-8");

    const decrypted = await decryptVault(fs.readFileSync(sourcePath, "utf-8"), sourcePassword);
    const clonedCipher = await encryptVault(decrypted, newPassword);
    fs.writeFileSync(destPath, clonedCipher, "utf-8");

    await expect(decryptVault(fs.readFileSync(destPath, "utf-8"), sourcePassword)).rejects.toThrow();
    const result = await decryptVault(fs.readFileSync(destPath, "utf-8"), newPassword);
    expect(result).toEqual(entries);
  });

  it("fails gracefully when source does not exist", () => {
    const fakePath = path.join(tmpDir, "nonexistent.vault");
    expect(fs.existsSync(fakePath)).toBe(false);
  });

  it("preserves all entries after cloning", async () => {
    const entries = { A: "1", B: "2", C: "3", D: "4" };
    const password = "multipass";
    const cipher = await encryptVault(entries, password);
    const decrypted = await decryptVault(cipher, password);
    expect(Object.keys(decrypted)).toHaveLength(4);
    expect(decrypted).toEqual(entries);
  });
});
