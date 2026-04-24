import fs from "fs";
import os from "os";
import path from "path";
import { parseEnvFile, importCommand } from "./import";
import { initVault } from "../../vault/store";
import { getEntry } from "../../vault/entries";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-import-test-"));
}

describe("parseEnvFile", () => {
  it("parses simple key=value pairs", () => {
    const result = parseEnvFile("FOO=bar\nBAZ=qux");
    expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("ignores comments and blank lines", () => {
    const result = parseEnvFile("# comment\n\nFOO=bar");
    expect(result).toEqual({ FOO: "bar" });
  });

  it("strips double quotes from values", () => {
    const result = parseEnvFile('KEY="hello world"');
    expect(result).toEqual({ KEY: "hello world" });
  });

  it("strips single quotes from values", () => {
    const result = parseEnvFile("KEY='hello world'");
    expect(result).toEqual({ KEY: "hello world" });
  });

  it("handles values with equals signs", () => {
    const result = parseEnvFile("KEY=a=b=c");
    expect(result).toEqual({ KEY: "a=b=c" });
  });

  it("ignores lines without equals sign", () => {
    const result = parseEnvFile("INVALID\nFOO=bar");
    expect(result).toEqual({ FOO: "bar" });
  });
});

describe("importCommand", () => {
  it("imports entries from a .env file into the vault", async () => {
    const dir = makeTempDir();
    const password = "testpass";
    await initVault(password, dir);

    const envFile = path.join(dir, ".env");
    fs.writeFileSync(envFile, "DB_URL=postgres://localhost/db\nSECRET=abc123\n");

    const promptSpy = jest
      .spyOn(require("./import"), "promptPassword")
      .mockResolvedValue(password);

    await importCommand(envFile, dir);

    const dbUrl = await getEntry("DB_URL", password, dir);
    expect(dbUrl).toBe("postgres://localhost/db");

    const secret = await getEntry("SECRET", password, dir);
    expect(secret).toBe("abc123");

    promptSpy.mockRestore();
    fs.rmSync(dir, { recursive: true });
  });
});
