import fs from "fs";
import path from "path";
import readline from "readline";
import { getVaultPath, vaultExists } from "../../vault/store";
import { listEntries } from "../../vault/entries";
import { decryptVault } from "../../crypto";
import { assertVaultUnlocked } from "./lock-guard";

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerWatch(program: import("commander").Command) {
  program
    .command("watch")
    .description("Watch the vault file for changes and display a summary on update")
    .option("--dir <dir>", "vault directory", process.cwd())
    .action(async (opts) => {
      assertVaultUnlocked(opts.dir);

      if (!vaultExists(opts.dir)) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }

      const password = await promptPassword("Vault password: ");
      const vaultPath = getVaultPath(opts.dir);

      console.log(`Watching vault at ${vaultPath} for changes...`);
      console.log("Press Ctrl+C to stop.\n");

      let lastMtime = fs.statSync(vaultPath).mtimeMs;

      const printSummary = () => {
        try {
          const raw = fs.readFileSync(vaultPath, "utf-8");
          const data = decryptVault(raw, password);
          const entries = listEntries(data);
          console.log(`[${new Date().toLocaleTimeString()}] Vault updated — ${entries.length} entr${entries.length === 1 ? "y" : "ies"}`);
          entries.forEach((e) => console.log(`  • ${e.key}${e.tags?.length ? ` [${e.tags.join(", ")}]` : ""}`));
          console.log();
        } catch {
          console.error("[watch] Failed to read vault (wrong password or corrupt data).");
        }
      };

      printSummary();

      const watcher = fs.watch(vaultPath, () => {
        const mtime = fs.statSync(vaultPath).mtimeMs;
        if (mtime !== lastMtime) {
          lastMtime = mtime;
          printSummary();
        }
      });

      process.on("SIGINT", () => {
        watcher.close();
        console.log("\nStopped watching.");
        process.exit(0);
      });
    });
}
