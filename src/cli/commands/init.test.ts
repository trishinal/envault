import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { runInit } from "./init";
import { vaultExists } from "../../vault/store";

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "envault-init-test-"));
}

describe("runInit", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("creates a vault file when initialized with a valid password", async () => {
    const password = "securepassword123";
    jest.spyOn(require("readline"), "createInterface").mockImplementation(() => ({
      question: (_prompt: string, cb: (ans: string) => void) => cb(password),
      close: jest.fn(),
    }));

    await runInit(tmpDir);

    const exists = await vaultExists(tmpDir);
    expect(exists).toBe(true);
  });

  it("exits with error if vault already exists", async () => {
    const password = "securepassword123";
    const mockExit = jest.spyOn(process, "exit").mockImplementation((code?: number) => { throw new Error(`exit:${code}`); });

    jest.spyOn(require("readline"), "createInterface").mockImplementation(() => ({
      question: (_prompt: string, cb: (ans: string) => void) => cb(password),
      close: jest.fn(),
    }));

    await runInit(tmpDir);

    await expect(runInit(tmpDir)).rejects.toThrow("exit:1");
    mockExit.mockRestore();
  });

  it("exits with error if passwords do not match", async () => {
    const mockExit = jest.spyOn(process, "exit").mockImplementation((code?: number) => { throw new Error(`exit:${code}`); });
    let callCount = 0;
    jest.spyOn(require("readline"), "createInterface").mockImplementation(() => ({
      question: (_prompt: string, cb: (ans: string) => void) => cb(callCount++ === 0 ? "password1" : "password2"),
      close: jest.fn(),
    }));

    await expect(runInit(tmpDir)).rejects.toThrow("exit:1");
    mockExit.mockRestore();
  });
});
