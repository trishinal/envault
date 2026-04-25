import { Command } from "commander";
import * as readline from "readline";
import { vaultExists, getVaultPath } from "../../vault/store";
import { decryptVault, encryptVault } from "../../crypto";
import * as fs from "fs";

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

export function registerTags(program: Command): void {
  const tags = program.command("tags").description("Manage tags on vault entries");

  tags
    .command("add <key> <tag>")
    .description("Add a tag to an entry")
    .action(async (key: string, tag: string) => {
      if (!vaultExists()) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }
      const password = await promptPassword("Password: ");
      const vaultPath = getVaultPath();
      const raw = fs.readFileSync(vaultPath, "utf-8");
      const data = await decryptVault(raw, password);
      if (!data.entries[key]) {
        console.error(`Entry "${key}" not found.`);
        process.exit(1);
      }
      const entry = data.entries[key];
      if (!entry.tags) entry.tags = [];
      if (!entry.tags.includes(tag)) {
        entry.tags.push(tag);
      }
      const encrypted = await encryptVault(data, password);
      fs.writeFileSync(vaultPath, encrypted, "utf-8");
      console.log(`Tag "${tag}" added to "${key}".`);
    });

  tags
    .command("remove <key> <tag>")
    .description("Remove a tag from an entry")
    .action(async (key: string, tag: string) => {
      if (!vaultExists()) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }
      const password = await promptPassword("Password: ");
      const vaultPath = getVaultPath();
      const raw = fs.readFileSync(vaultPath, "utf-8");
      const data = await decryptVault(raw, password);
      if (!data.entries[key]) {
        console.error(`Entry "${key}" not found.`);
        process.exit(1);
      }
      const entry = data.entries[key];
      entry.tags = (entry.tags || []).filter((t: string) => t !== tag);
      const encrypted = await encryptVault(data, password);
      fs.writeFileSync(vaultPath, encrypted, "utf-8");
      console.log(`Tag "${tag}" removed from "${key}".`);
    });

  tags
    .command("list <key>")
    .description("List tags on an entry")
    .action(async (key: string) => {
      if (!vaultExists()) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }
      const password = await promptPassword("Password: ");
      const vaultPath = getVaultPath();
      const raw = fs.readFileSync(vaultPath, "utf-8");
      const data = await decryptVault(raw, password);
      if (!data.entries[key]) {
        console.error(`Entry "${key}" not found.`);
        process.exit(1);
      }
      const tagList: string[] = data.entries[key].tags || [];
      if (tagList.length === 0) {
        console.log(`No tags on "${key}".`);
      } else {
        console.log(`Tags for "${key}": ${tagList.join(", ")}`);
      }
    });
}
