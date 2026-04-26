import fs from "fs";
import path from "path";
import readline from "readline";
import { decryptVault } from "../../crypto/index";
import { getVaultPath, vaultExists } from "../../vault/store";
import { listEntries } from "../../vault/entries";
import type { Command } from "commander";

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

export function diffVaults(
  entriesA: Record<string, string>,
  entriesB: Record<string, string>
): { added: string[]; removed: string[]; changed: string[] } {
  const keysA = new Set(Object.keys(entriesA));
  const keysB = new Set(Object.keys(entriesB));

  const added = [...keysB].filter((k) => !keysA.has(k));
  const removed = [...keysA].filter((k) => !keysB.has(k));
  const changed = [...keysA].filter((k) => keysB.has(k) && entriesA[k] !== entriesB[k]);

  return { added, removed, changed };
}

export function registerDiff(program: Command): void {
  program
    .command("diff <otherVault>")
    .description("Compare the current vault with another vault file")
    .action(async (otherVault: string) => {
      const vaultPath = getVaultPath();
      if (!vaultExists()) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }

      const resolvedOther = path.resolve(otherVault);
      if (!fs.existsSync(resolvedOther)) {
        console.error(`File not found: ${resolvedOther}`);
        process.exit(1);
      }

      const password = await promptPassword("Master password: ");

      let entriesA: Record<string, string>;
      try {
        const dataA = fs.readFileSync(vaultPath, "utf-8");
        entriesA = await decryptVault(dataA, password);
      } catch {
        console.error("Failed to decrypt current vault. Wrong password?");
        process.exit(1);
      }

      let entriesB: Record<string, string>;
      try {
        const dataB = fs.readFileSync(resolvedOther, "utf-8");
        entriesB = await decryptVault(dataB, password);
      } catch {
        console.error("Failed to decrypt the other vault. Wrong password?");
        process.exit(1);
      }

      const { added, removed, changed } = diffVaults(entriesA, entriesB);

      if (added.length === 0 && removed.length === 0 && changed.length === 0) {
        console.log("Vaults are identical.");
        return;
      }

      for (const key of added) console.log(`+ ${key}`);
      for (const key of removed) console.log(`- ${key}`);
      for (const key of changed) console.log(`~ ${key}`);
    });
}
