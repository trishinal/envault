import * as path from "path";
import * as readline from "readline";
import { initVault, vaultExists, getVaultPath } from "../../vault/store";

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function runInit(vaultDir: string = process.cwd()): Promise<void> {
  const vaultPath = getVaultPath(vaultDir);

  if (await vaultExists(vaultDir)) {
    console.error(`Vault already exists at: ${vaultPath}`);
    process.exit(1);
  }

  const password = await promptPassword("Enter a master password for the vault: ");
  if (!password || password.trim().length === 0) {
    console.error("Password cannot be empty.");
    process.exit(1);
  }

  const confirm = await promptPassword("Confirm master password: ");
  if (password !== confirm) {
    console.error("Passwords do not match.");
    process.exit(1);
  }

  await initVault(vaultDir, password);
  console.log(`Vault initialized at: ${vaultPath}`);
}
