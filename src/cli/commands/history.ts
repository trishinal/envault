import fs from "fs";
import path from "path";
import readline from "readline";
import { getVaultPath, vaultExists } from "../../vault/store";
import { decryptVault } from "../../crypto";

export function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    process.stderr.write(prompt);
    rl.question("", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export interface HistoryEntry {
  timestamp: string;
  action: string;
  key: string;
  by?: string;
}

export function getHistoryPath(vaultDir: string): string {
  return path.join(vaultDir, ".envault_history.json");
}

export function readHistory(vaultDir: string): HistoryEntry[] {
  const histPath = getHistoryPath(vaultDir);
  if (!fs.existsSync(histPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(histPath, "utf-8"));
  } catch {
    return [];
  }
}

export function appendHistory(vaultDir: string, entry: HistoryEntry): void {
  const histPath = getHistoryPath(vaultDir);
  const entries = readHistory(vaultDir);
  entries.push(entry);
  // Keep last 500 entries
  const trimmed = entries.slice(-500);
  fs.writeFileSync(histPath, JSON.stringify(trimmed, null, 2));
}

export function registerHistory(program: import("commander").Command): void {
  program
    .command("history")
    .description("Show the history of vault operations")
    .option("-n, --limit <number>", "Number of entries to show", "20")
    .option("-k, --key <key>", "Filter history by key name")
    .option("-d, --dir <path>", "Vault directory", process.cwd())
    .action(async (opts) => {
      if (!vaultExists(opts.dir)) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }
      const password = await promptPassword("Vault password: ");
      const vaultPath = getVaultPath(opts.dir);
      const raw = fs.readFileSync(vaultPath, "utf-8");
      try {
        await decryptVault(raw, password);
      } catch {
        console.error("Invalid password.");
        process.exit(1);
      }
      let entries = readHistory(opts.dir);
      if (opts.key) {
        entries = entries.filter((e) => e.key === opts.key);
      }
      const limit = parseInt(opts.limit, 10);
      const shown = entries.slice(-limit).reverse();
      if (shown.length === 0) {
        console.log("No history found.");
        return;
      }
      console.log(`\nVault History (last ${shown.length} entries):\n`);
      for (const entry of shown) {
        const by = entry.by ? ` [${entry.by}]` : "";
        console.log(`  ${entry.timestamp}  ${entry.action.padEnd(8)}  ${entry.key}${by}`);
      }
      console.log("");
    });
}
