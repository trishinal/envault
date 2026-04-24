import * as readline from "readline";
import { listEntries, getEntry } from "../../vault/entries";

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

export type ExportFormat = "dotenv" | "json";

export function formatEntries(
  entries: Record<string, string>,
  format: ExportFormat
): string {
  if (format === "json") {
    return JSON.stringify(entries, null, 2);
  }
  // dotenv format
  return Object.entries(entries)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join("\n");
}

export async function runExport(
  format: ExportFormat = "dotenv",
  vaultDir: string = process.cwd()
): Promise<void> {
  const password = await promptPassword("Enter vault password: ");

  const keys = await listEntries(vaultDir, password);
  if (keys.length === 0) {
    console.log(format === "json" ? "{}" : "");
    return;
  }

  const entries: Record<string, string> = {};
  for (const key of keys) {
    const value = await getEntry(vaultDir, password, key);
    if (value !== null) {
      entries[key] = value;
    }
  }

  console.log(formatEntries(entries, format));
}
