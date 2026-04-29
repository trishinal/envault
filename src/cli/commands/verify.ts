import fs from "fs";
import path from "path";
import readline from "readline";
import { decryptVault } from "../../crypto/index";
import { getVaultPath, vaultExists } from "../../vault/store";

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
    process.stderr.write(prompt);
    rl.question("", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function verifyVaultPassword(vaultDir: string, password: string): Promise<boolean> {
  const vaultPath = getVaultPath(vaultDir);
  const raw = fs.readFileSync(vaultPath, "utf-8");
  const encrypted = JSON.parse(raw);
  try {
    await decryptVault(encrypted, password);
    return true;
  } catch {
    return false;
  }
}

export function registerVerify(program: import("commander").Command) {
  program
    .command("verify")
    .description("Verify that a password can unlock the current vault")
    .option("-d, --dir <dir>", "Vault directory", process.cwd())
    .action(async (opts) => {
      if (!vaultExists(opts.dir)) {
        console.error("No vault found in", opts.dir);
        process.exit(1);
      }

      const password = await promptPassword("Enter vault password: ");

      const valid = await verifyVaultPassword(opts.dir, password);

      if (valid) {
        console.log("✔ Password is correct. Vault unlocked successfully.");
        process.exit(0);
      } else {
        console.error("✘ Incorrect password. Could not unlock vault.");
        process.exit(1);
      }
    });
}
