import fs from "fs";
import path from "path";
import { Command } from "commander";
import { getVaultPath, vaultExists } from "../../vault/store";
import { decryptVault } from "../../crypto";
import { listEntries } from "../../vault/entries";
import { isTtlExpired, readTtl } from "./ttl";
import { isExpired, readExpire } from "./expire";
import { isVaultLocked } from "./lock";
import * as readline from "readline";

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    rl.question("", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export interface DoctorResult {
  vaultExists: boolean;
  vaultLocked: boolean;
  decryptable: boolean;
  totalKeys: number;
  expiredTtlKeys: string[];
  expiredKeys: string[];
  warnings: string[];
}

export async function runDoctor(vaultDir: string, password: string): Promise<DoctorResult> {
  const result: DoctorResult = {
    vaultExists: false,
    vaultLocked: false,
    decryptable: false,
    totalKeys: 0,
    expiredTtlKeys: [],
    expiredKeys: [],
    warnings: [],
  };

  result.vaultExists = vaultExists(vaultDir);
  if (!result.vaultExists) {
    result.warnings.push("No vault found in directory.");
    return result;
  }

  result.vaultLocked = isVaultLocked(vaultDir);
  if (result.vaultLocked) {
    result.warnings.push("Vault is currently locked.");
    return result;
  }

  try {
    const vaultPath = getVaultPath(vaultDir);
    const raw = fs.readFileSync(vaultPath, "utf-8");
    const data = decryptVault(raw, password);
    result.decryptable = true;
    const entries = listEntries(data);
    result.totalKeys = entries.length;

    const ttlData = readTtl(vaultDir);
    for (const [key, record] of Object.entries(ttlData)) {
      if (isTtlExpired(record)) result.expiredTtlKeys.push(key);
    }

    const expireData = readExpire(vaultDir);
    for (const [key, record] of Object.entries(expireData)) {
      if (isExpired(record)) result.expiredKeys.push(key);
    }

    if (result.expiredTtlKeys.length > 0)
      result.warnings.push(`${result.expiredTtlKeys.length} key(s) have expired TTLs.`);
    if (result.expiredKeys.length > 0)
      result.warnings.push(`${result.expiredKeys.length} key(s) have passed their expiry date.`);
  } catch {
    result.decryptable = false;
    result.warnings.push("Failed to decrypt vault. Wrong password?");
  }

  return result;
}

export function registerDoctor(program: Command) {
  program
    .command("doctor")
    .description("Run health checks on the vault")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action(async (opts) => {
      const password = await promptPassword("Password: ");
      const result = await runDoctor(opts.dir, password);

      console.log(`\n🏥 Vault Doctor Report`);
      console.log(`  Vault exists:   ${result.vaultExists ? "✅" : "❌"}`);
      console.log(`  Vault locked:   ${result.vaultLocked ? "🔒" : "🔓"}`);
      console.log(`  Decryptable:    ${result.decryptable ? "✅" : "❌"}`);
      if (result.decryptable) {
        console.log(`  Total keys:     ${result.totalKeys}`);
        console.log(`  Expired TTLs:   ${result.expiredTtlKeys.length}`);
        console.log(`  Expired keys:   ${result.expiredKeys.length}`);
      }
      if (result.warnings.length > 0) {
        console.log(`\n⚠️  Warnings:`);
        result.warnings.forEach((w) => console.log(`  - ${w}`));
      } else {
        console.log(`\n✅ All checks passed.`);
      }
    });
}
