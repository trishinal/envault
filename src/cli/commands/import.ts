import fs from "fs";
import path from "path";
import readline from "readline";
import { setEntry } from "../../vault/entries";
import { vaultExists } from "../../vault/store";

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function parseEnvFile(content: string): Record<string, string> {
  const entries: Record<string, string> = {};
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) entries[key] = value;
  }
  return entries;
}

export async function importCommand(
  filePath: string,
  vaultDir?: string
): Promise<void> {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  if (!vaultExists(vaultDir)) {
    console.error("No vault found. Run `envault init` first.");
    process.exit(1);
  }

  const password = await promptPassword("Enter vault password: ");
  const content = fs.readFileSync(resolvedPath, "utf-8");
  const entries = parseEnvFile(content);
  const keys = Object.keys(entries);

  if (keys.length === 0) {
    console.log("No entries found in file.");
    return;
  }

  let imported = 0;
  for (const key of keys) {
    try {
      await setEntry(key, entries[key], password, vaultDir);
      imported++;
    } catch (err) {
      console.error(`Failed to import key "${key}": ${(err as Error).message}`);
    }
  }

  console.log(`Imported ${imported} of ${keys.length} entries.`);
}
