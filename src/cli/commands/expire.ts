import fs from "fs";
import path from "path";
import readline from "readline";
import { getVaultPath, vaultExists } from "../../vault/store";
import { decryptVault, encryptVault } from "../../crypto";
import { assertVaultUnlocked } from "./lock-guard";

export function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    process.stderr.write(prompt);
    rl.question("", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function getExpireFilePath(vaultDir: string): string {
  return path.join(vaultDir, ".expire");
}

export type ExpireMap = Record<string, number>; // key -> unix timestamp ms

export function readExpire(vaultDir: string): ExpireMap {
  const p = getExpireFilePath(vaultDir);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function writeExpire(vaultDir: string, data: ExpireMap): void {
  fs.writeFileSync(getExpireFilePath(vaultDir), JSON.stringify(data, null, 2));
}

export function isExpired(ts: number): boolean {
  return Date.now() > ts;
}

export function registerExpire(program: import("commander").Command): void {
  const cmd = program.command("expire").description("Manage TTL/expiry for vault entries");

  cmd
    .command("set <key> <duration>")
    .description("Set expiry for a key (e.g. 7d, 24h, 30m)")
    .action(async (key: string, duration: string) => {
      assertVaultUnlocked();
      if (!vaultExists()) { console.error("No vault found. Run 'envault init'."); process.exit(1); }
      const ms = parseDuration(duration);
      if (ms === null) { console.error(`Invalid duration: ${duration}`); process.exit(1); }
      const vaultDir = path.dirname(getVaultPath());
      const expire = readExpire(vaultDir);
      expire[key] = Date.now() + ms;
      writeExpire(vaultDir, expire);
      console.log(`Expiry set for '${key}': ${new Date(expire[key]).toISOString()}`);
    });

  cmd
    .command("check")
    .description("List entries and their expiry status")
    .action(async () => {
      assertVaultUnlocked();
      if (!vaultExists()) { console.error("No vault found."); process.exit(1); }
      const password = await promptPassword("Password: ");
      const vaultDir = path.dirname(getVaultPath());
      const raw = fs.readFileSync(getVaultPath());
      const entries = await decryptVault(raw, password);
      const expire = readExpire(vaultDir);
      const now = Date.now();
      for (const key of Object.keys(entries)) {
        const ts = expire[key];
        if (!ts) { console.log(`  ${key}  (no expiry)`); }
        else if (now > ts) { console.log(`  ${key}  EXPIRED at ${new Date(ts).toISOString()}`); }
        else { console.log(`  ${key}  expires ${new Date(ts).toISOString()}`); }
      }
    });

  cmd
    .command("purge")
    .description("Remove all expired entries from the vault")
    .action(async () => {
      assertVaultUnlocked();
      if (!vaultExists()) { console.error("No vault found."); process.exit(1); }
      const password = await promptPassword("Password: ");
      const vaultDir = path.dirname(getVaultPath());
      const raw = fs.readFileSync(getVaultPath());
      const entries = await decryptVault(raw, password);
      const expire = readExpire(vaultDir);
      let purged = 0;
      for (const key of Object.keys(expire)) {
        if (isExpired(expire[key]) && key in entries) {
          delete entries[key];
          delete expire[key];
          purged++;
        }
      }
      const encrypted = await encryptVault(entries, password);
      fs.writeFileSync(getVaultPath(), encrypted);
      writeExpire(vaultDir, expire);
      console.log(`Purged ${purged} expired entry/entries.`);
    });
}

export function parseDuration(s: string): number | null {
  const match = s.match(/^(\d+)(d|h|m|s)$/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return n * multipliers[unit];
}
