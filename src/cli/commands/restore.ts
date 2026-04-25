import fs from "fs";
import path from "path";
import readline from "readline";
import { getVaultPath } from "../../vault/store";
import { decryptVault } from "../../crypto";

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

export function registerRestore(program: import("commander").Command): void {
  program
    .command("restore <backupFile>")
    .description("Restore the vault from a backup file")
    .option("-f, --force", "Overwrite existing vault without confirmation")
    .action(async (backupFile: string, options) => {
      const resolvedBackup = path.resolve(backupFile);

      if (!fs.existsSync(resolvedBackup)) {
        console.error(`Backup file not found: ${resolvedBackup}`);
        process.exit(1);
      }

      const password = await promptPassword("Enter vault password to verify backup: ");

      let backupData: Buffer;
      try {
        backupData = fs.readFileSync(resolvedBackup);
      } catch {
        console.error("Failed to read backup file.");
        process.exit(1);
      }

      try {
        await decryptVault(backupData.toString("utf-8"), password);
      } catch {
        console.error("Invalid password or corrupted backup file.");
        process.exit(1);
      }

      const vaultPath = getVaultPath();

      if (fs.existsSync(vaultPath) && !options.force) {
        const confirm = await promptPassword("Existing vault will be overwritten. Continue? (yes/no): ");
        if (confirm.trim().toLowerCase() !== "yes") {
          console.log("Restore cancelled.");
          return;
        }
      }

      try {
        fs.copyFileSync(resolvedBackup, vaultPath);
        console.log("Vault restored successfully.");
      } catch (err) {
        console.error("Failed to restore vault:", (err as Error).message);
        process.exit(1);
      }
    });
}
