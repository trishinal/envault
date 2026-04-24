import path from "path";
import fs from "fs";
import { Command } from "commander";
import { getVaultPath, vaultExists } from "../../vault/store";
import { listEntries } from "../../vault/entries";
import { decryptVault } from "../../crypto";
import * as readline from "readline";

/**
 * Prompts the user for their vault password securely.
 */
function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });
    process.stderr.write(prompt);
    rl.question("", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Formats a file size in bytes to a human-readable string.
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Registers the `info` command on the CLI program.
 *
 * Displays metadata about the current vault: location, size,
 * creation/modification times, and number of stored entries.
 */
export function registerInfo(program: Command): void {
  program
    .command("info")
    .description("Display information about the current vault")
    .option("--dir <directory>", "directory containing the vault", process.cwd())
    .action(async (options: { dir: string }) => {
      const vaultPath = getVaultPath(options.dir);

      if (!vaultExists(options.dir)) {
        console.error(
          `No vault found in ${options.dir}. Run 'envault init' to create one.`
        );
        process.exit(1);
      }

      let stats: fs.Stats;
      try {
        stats = fs.statSync(vaultPath);
      } catch (err) {
        console.error(`Failed to read vault file: ${(err as Error).message}`);
        process.exit(1);
      }

      // Attempt to count entries by decrypting the vault
      let entryCount: number | null = null;
      try {
        const password = await promptPassword("Vault password: ");
        const raw = fs.readFileSync(vaultPath, "utf-8");
        const vault = decryptVault(raw, password);
        entryCount = listEntries(vault).length;
      } catch {
        // Non-fatal — we still show file-level info
        console.error(
          "Could not decrypt vault (wrong password?). Entry count unavailable.\n"
        );
      }

      console.log("\nVault Information");
      console.log("─────────────────────────────────────");
      console.log(`  Path     : ${path.resolve(vaultPath)}`);
      console.log(`  Size     : ${formatBytes(stats.size)}`);
      console.log(`  Created  : ${stats.birthtime.toLocaleString()}`);
      console.log(`  Modified : ${stats.mtime.toLocaleString()}`);
      if (entryCount !== null) {
        console.log(`  Entries  : ${entryCount}`);
      }
      console.log();
    });
}
