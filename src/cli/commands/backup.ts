import fs from "fs";
import path from "path";
import readline from "readline";
import { getVaultPath, vaultExists } from "../../vault/store";

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

function getBackupPath(vaultDir: string, label?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = label ? `vault-backup-${label}-${timestamp}.enc` : `vault-backup-${timestamp}.enc`;
  return path.join(vaultDir, filename);
}

export function registerBackup(program: import("commander").Command): void {
  program
    .command("backup")
    .description("Create a backup copy of the encrypted vault")
    .option("-d, --dir <directory>", "Directory to store the backup", ".")
    .option("-l, --label <label>", "Optional label for the backup filename")
    .action(async (options) => {
      const vaultPath = getVaultPath();

      if (!vaultExists()) {
        console.error("No vault found. Run 'envault init' first.");
        process.exit(1);
      }

      const destDir = path.resolve(options.dir);

      if (!fs.existsSync(destDir)) {
        console.error(`Destination directory does not exist: ${destDir}`);
        process.exit(1);
      }

      const backupPath = getBackupPath(destDir, options.label);

      try {
        fs.copyFileSync(vaultPath, backupPath);
        console.log(`Vault backed up to: ${backupPath}`);
      } catch (err) {
        console.error("Failed to create backup:", (err as Error).message);
        process.exit(1);
      }
    });
}
