import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { formatEntries, runExport } from "./export";
import { initVault } from "../../vault/store";
import { setEntry } from "../../vault/entries";

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "envault-export-test-"));
}

describe("formatEntries", () => {
  const entries = { API_KEY: "abc123", DB_URL: "postgres://localhost/db" };

  it("formats entries as dotenv", () => {
    const result = formatEntries(entries, "dotenv");
    expect(result).toContain("API_KEY=\"abc123\"");
    expect(result).toContain("DB_URL=\"postgres://localhost/db\"");
  });

  it("formats entries as json", () => {
    const result = formatEntries(entries, "json");
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(entries);
  });

  it("returns empty string for dotenv with no entries", () => {
    expect(formatEntries({}, "dotenv")).toBe("");
  });

  it("returns empty object string for json with no entries", () => {
    expect(formatEntries({}, "json")).toBe("{}");
  });
});

describe("runExport", () => {
  let tmpDir: string;
  const password = "testpassword";

  beforeEach(async () => {
    tmpDir = await makeTempDir();
    await initVault(tmpDir, password);
    await setEntry(tmpDir, password, "FOO", "bar");
    await setEntry(tmpDir, password, "BAZ", "qux");
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("exports entries in dotenv format", async () => {
    jest.spyOn(require("readline"), "createInterface").mockImplementation(() => ({
      question: (_p: string, cb: (a: string) => void) => cb(password),
      close: jest.fn(),
    }));
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runExport("dotenv", tmpDir);
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain("FOO=");
    expect(output).toContain("BAZ=");
    spy.mockRestore();
  });

  it("exports entries in json format", async () => {
    jest.spyOn(require("readline"), "createInterface").mockImplementation(() => ({
      question: (_p: string, cb: (a: string) => void) => cb(password),
      close: jest.fn(),
    }));
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runExport("json", tmpDir);
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed["FOO"]).toBe("bar");
    expect(parsed["BAZ"]).toBe("qux");
    spy.mockRestore();
  });
});
