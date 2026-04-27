import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { getVaultPath, vaultExists } from "../../vault/store";
import { decryptVault, encryptVault } from "../../crypto";
import { assertVaultUnlocked } from "./lock-guard";

const PIN_FILE = ".envault-pins";

export function getPinFilePath(vaultDir: string): string {
  return path.join(vaultDir, PIN_FILE);
}

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function readPins(vaultDir: string): string[] {
  const pinFile = getPinFilePath(vaultDir);
  if (!fs.existsSync(pinFile)) return [];
  const content = fs.readFileSync(pinFile, "utf-8").trim();
  return content ? content.split("\n").filter(Boolean) : [];
}

export function writePins(vaultDir: string, pins: string[]): void {
  const pinFile = getPinFilePath(vaultDir);
  fs.writeFileSync(pinFile, pins.join("\n") + (pins.length ? "\n" : ""), "utf-8");
}

export function registerPin(program: import("commander").Command): void {
  const pin = program.command("pin").description("Pin or unpin frequently used keys for quick access");

  pin
    .command("add <key>")
    .description("Pin a key")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action(async (key: string, opts: { dir: string }) => {
      assertVaultUnlocked(opts.dir);
      if (!vaultExists(opts.dir)) { console.error("No vault found."); process.exit(1); }
      const password = await promptPassword("Password: ");
      const vaultPath = getVaultPath(opts.dir);
      const raw = fs.readFileSync(vaultPath, "utf-8");
      const vault = await decryptVault(raw, password);
      if (!(key in vault.entries)) { console.error(`Key "${key}" not found in vault.`); process.exit(1); }
      const pins = readPins(opts.dir);
      if (pins.includes(key)) { console.log(`Key "${key}" is already pinned.`); return; }
      writePins(opts.dir, [...pins, key]);
      console.log(`Pinned "${key}".`);
    });

  pin
    .command("remove <key>")
    .description("Unpin a key")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action(async (key: string, opts: { dir: string }) => {
      assertVaultUnlocked(opts.dir);
      const pins = readPins(opts.dir);
      if (!pins.includes(key)) { console.log(`Key "${key}" is not pinned.`); return; }
      writePins(opts.dir, pins.filter((p) => p !== key));
      console.log(`Unpinned "${key}".`);
    });

  pin
    .command("list")
    .description("List all pinned keys and their values")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action(async (opts: { dir: string }) => {
      assertVaultUnlocked(opts.dir);
      if (!vaultExists(opts.dir)) { console.error("No vault found."); process.exit(1); }
      const pins = readPins(opts.dir);
      if (!pins.length) { console.log("No pinned keys."); return; }
      const password = await promptPassword("Password: ");
      const vaultPath = getVaultPath(opts.dir);
      const raw = fs.readFileSync(vaultPath, "utf-8");
      const vault = await decryptVault(raw, password);
      console.log("Pinned keys:");
      for (const key of pins) {
        const value = vault.entries[key] ?? "(not found)";
        console.log(`  ${key}=${value}`);
      }
    });
}
