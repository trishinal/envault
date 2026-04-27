import { Command } from "commander";
import * as readline from "readline";
import { decryptVault } from "../../crypto/index.js";
import { getVaultPath, vaultExists } from "../../vault/store.js";
import { listEntries } from "../../vault/entries.js";
import { readFileSync } from "fs";
import { spawn } from "child_process";

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

export function registerRun(program: Command): void {
  program
    .command("run <cmd...>")
    .description("Run a command with vault entries injected as environment variables")
    .option("-t, --tags <tags>", "Only inject entries matching these tags (comma-separated)")
    .action(async (cmd: string[], options: { tags?: string }) => {
      if (!vaultExists()) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }

      const password = await promptPassword("Vault password: ");

      try {
        const vaultPath = getVaultPath();
        const encrypted = readFileSync(vaultPath, "utf-8");
        const vault = await decryptVault(encrypted, password);
        const entries = listEntries(vault);

        const filterTags = options.tags
          ? options.tags.split(",").map((t) => t.trim())
          : null;

        const injected: Record<string, string> = {};
        for (const entry of entries) {
          if (filterTags && entry.tags) {
            const hasMatch = filterTags.some((t) => entry.tags!.includes(t));
            if (!hasMatch) continue;
          }
          injected[entry.key] = entry.value;
        }

        const child = spawn(cmd[0], cmd.slice(1), {
          env: { ...process.env, ...injected },
          stdio: "inherit",
          shell: true,
        });

        child.on("exit", (code) => {
          process.exit(code ?? 0);
        });
      } catch {
        console.error("Failed to decrypt vault. Check your password.");
        process.exit(1);
      }
    });
}
