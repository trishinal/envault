import * as readline from "readline";
import { getVaultPath, vaultExists } from "../../vault/store";
import { decryptVault, encryptVault } from "../../crypto";
import { getEntry, setEntry, deleteEntry, hasEntry } from "../../vault/entries";
import * as fs from "fs";

export function promptPassword(prompt: string): Promise<string> {
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

export async function renameCommand(
  sourceKey: string,
  destKey: string,
  options: { vaultPath?: string; password?: string; overwrite?: boolean }
): Promise<void> {
  const vaultPath = options.vaultPath ?? getVaultPath();

  if (!vaultExists(vaultPath)) {
    console.error("No vault found. Run `envault init` to create one.");
    process.exit(1);
  }

  const password = options.password ?? (await promptPassword("Enter vault password: "));
  const raw = fs.readFileSync(vaultPath, "utf-8");
  let vault: Record<string, string>;

  try {
    vault = await decryptVault(raw, password);
  } catch {
    console.error("Failed to decrypt vault. Wrong password?");
    process.exit(1);
  }

  if (!hasEntry(vault, sourceKey)) {
    console.error(`Key "${sourceKey}" not found in vault.`);
    process.exit(1);
  }

  if (hasEntry(vault, destKey) && !options.overwrite) {
    console.error(
      `Key "${destKey}" already exists. Use --overwrite to replace it.`
    );
    process.exit(1);
  }

  const value = getEntry(vault, sourceKey);
  let updated = setEntry(vault, destKey, value);
  updated = deleteEntry(updated, sourceKey);

  const encrypted = await encryptVault(updated, password);
  fs.writeFileSync(vaultPath, encrypted, "utf-8");

  console.log(`Renamed "${sourceKey}" to "${destKey}".`);
}
