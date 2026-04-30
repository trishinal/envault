import fs from "fs";
import path from "path";
import readline from "readline";
import { decryptVault, encryptVault } from "../../crypto/index";
import { getVaultPath, vaultExists } from "../../vault/store";
import { listEntries, deleteEntry } from "../../vault/entries";
import { assertVaultUnlocked } from "./lock-guard";

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    let pwd = "";
    process.stdin.on("data", (ch) => {
      const c = ch.toString();
      if (c === "\n" || c === "\r") {
        process.stdin.setRawMode?.(false);
        process.stdout.write("\n");
        rl.close();
        resolve(pwd);
      } else if (c === "\u0003") {
        process.exit();
      } else {
        pwd += c;
      }
    });
  });
}

export interface PruneOptions {
  vaultDir?: string;
  dryRun?: boolean;
}

export async function pruneExpiredEntries(
  password: string,
  options: PruneOptions = {}
): Promise<string[]> {
  const vaultDir = options.vaultDir ?? process.cwd();
  const vaultPath = getVaultPath(vaultDir);

  if (!vaultExists(vaultDir)) {
    throw new Error("No vault found. Run `envault init` first.");
  }

  const encrypted = fs.readFileSync(vaultPath, "utf-8");
  const vault = await decryptVault(encrypted, password);
  const entries = listEntries(vault);

  const now = Date.now();
  const pruned: string[] = [];

  for (const key of entries) {
    const meta = vault.entries[key];
    if (meta?.expiresAt && meta.expiresAt <= now) {
      pruned.push(key);
      if (!options.dryRun) {
        deleteEntry(vault, key);
      }
    }
  }

  if (!options.dryRun && pruned.length > 0) {
    const updated = await encryptVault(vault, password);
    fs.writeFileSync(vaultPath, updated, "utf-8");
  }

  return pruned;
}

export function registerPrune(program: any) {
  program
    .command("prune")
    .description("Remove all expired entries from the vault")
    .option("--dry-run", "Show what would be removed without deleting", false)
    .action(async (opts: { dryRun: boolean }) => {
      assertVaultUnlocked();
      const password = await promptPassword("Vault password: ");
      try {
        const removed = await pruneExpiredEntries(password, { dryRun: opts.dryRun });
        if (removed.length === 0) {
          console.log("No expired entries found.");
        } else if (opts.dryRun) {
          console.log(`Would remove ${removed.length} expired entry(s):`);
          removed.forEach((k) => console.log(`  - ${k}`));
        } else {
          console.log(`Pruned ${removed.length} expired entry(s):`);
          removed.forEach((k) => console.log(`  - ${k}`));
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
