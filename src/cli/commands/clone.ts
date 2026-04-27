import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { decryptVault, encryptVault } from "../../crypto/index";
import { getVaultPath, vaultExists } from "../../vault/store";

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    let password = "";
    process.stdin.on("data", (char) => {
      const c = char.toString();
      if (c === "\n" || c === "\r") {
        process.stdin.setRawMode?.(false);
        process.stdout.write("\n");
        rl.close();
        resolve(password);
      } else if (c === "\u0003") {
        process.exit();
      } else {
        password += c;
      }
    });
  });
}

export function registerClone(program: import("commander").Command) {
  program
    .command("clone <source> <destination>")
    .description("Clone a vault to a new location with an optional new password")
    .option("--new-password", "Set a different password for the cloned vault")
    .action(async (source: string, destination: string, opts: { newPassword?: boolean }) => {
      const sourcePath = path.resolve(source);
      if (!fs.existsSync(sourcePath)) {
        console.error(`Source vault not found: ${sourcePath}`);
        process.exit(1);
      }

      const destPath = path.resolve(destination);
      if (fs.existsSync(destPath)) {
        console.error(`Destination already exists: ${destPath}`);
        process.exit(1);
      }

      const sourcePassword = await promptPassword("Source vault password: ");

      let entries: Record<string, string>;
      try {
        const ciphertext = fs.readFileSync(sourcePath, "utf-8");
        entries = await decryptVault(ciphertext, sourcePassword);
      } catch {
        console.error("Failed to decrypt source vault. Wrong password?");
        process.exit(1);
      }

      let destPassword = sourcePassword;
      if (opts.newPassword) {
        destPassword = await promptPassword("New vault password: ");
        const confirm = await promptPassword("Confirm new password: ");
        if (destPassword !== confirm) {
          console.error("Passwords do not match.");
          process.exit(1);
        }
      }

      const ciphertext = await encryptVault(entries, destPassword);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, ciphertext, "utf-8");
      console.log(`Vault cloned to ${destPath}`);
    });
}
