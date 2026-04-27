import fs from "fs";
import path from "path";
import readline from "readline";
import { decryptVault, encryptVault } from "../../crypto/index";
import { getVaultPath, vaultExists } from "../../vault/store";
import { listEntries, setEntry, hasEntry } from "../../vault/entries";

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    rl.question("", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export type MergeStrategy = "ours" | "theirs" | "interactive";

export async function mergeVaults(
  targetVaultPath: string,
  sourceVaultPath: string,
  targetData: Record<string, string>,
  sourceData: Record<string, string>,
  strategy: MergeStrategy
): Promise<Record<string, string>> {
  const merged: Record<string, string> = { ...targetData };

  for (const [key, value] of Object.entries(sourceData)) {
    if (!(key in merged)) {
      merged[key] = value;
    } else if (merged[key] !== value) {
      if (strategy === "theirs") {
        merged[key] = value;
      } else if (strategy === "ours") {
        // keep existing
      } else if (strategy === "interactive") {
        console.log(`\nConflict on key: ${key}`);
        console.log(`  [1] Keep current: ${merged[key]}`);
        console.log(`  [2] Use incoming: ${value}`);
        const choice = await promptPassword("Choose (1/2): ");
        if (choice.trim() === "2") {
          merged[key] = value;
        }
      }
    }
  }

  return merged;
}

export function registerMerge(program: import("commander").Command) {
  program
    .command("merge <source>")
    .description("Merge entries from another vault into the current vault")
    .option("-s, --strategy <strategy>", "Merge strategy: ours | theirs | interactive", "interactive")
    .action(async (source: string, options: { strategy: string }) => {
      const strategy = options.strategy as MergeStrategy;
      if (!["ours", "theirs", "interactive"].includes(strategy)) {
        console.error("Invalid strategy. Use: ours, theirs, or interactive");
        process.exit(1);
      }

      const targetPath = getVaultPath();
      if (!vaultExists()) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }

      const sourcePath = path.resolve(source);
      if (!fs.existsSync(sourcePath)) {
        console.error(`Source vault not found: ${sourcePath}`);
        process.exit(1);
      }

      const targetPassword = await promptPassword("Password for current vault: ");
      const sourcePassword = await promptPassword("Password for source vault: ");

      let targetData: Record<string, string>;
      let sourceData: Record<string, string>;

      try {
        const targetRaw = fs.readFileSync(targetPath, "utf-8");
        targetData = await decryptVault(targetRaw, targetPassword);
      } catch {
        console.error("Failed to decrypt current vault. Wrong password?");
        process.exit(1);
      }

      try {
        const sourceRaw = fs.readFileSync(sourcePath, "utf-8");
        sourceData = await decryptVault(sourceRaw, sourcePassword);
      } catch {
        console.error("Failed to decrypt source vault. Wrong password?");
        process.exit(1);
      }

      const merged = await mergeVaults(targetPath, sourcePath, targetData, sourceData, strategy);
      const encrypted = await encryptVault(merged, targetPassword);
      fs.writeFileSync(targetPath, encrypted, "utf-8");

      const addedCount = Object.keys(merged).length - Object.keys(targetData).length;
      console.log(`Merge complete. ${addedCount} new entries added.`);
    });
}
