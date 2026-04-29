import fs from "fs";
import path from "path";
import { Command } from "commander";
import * as readline from "readline";
import { vaultExists, getVaultPath } from "../../vault/store";
import { listEntries } from "../../vault/entries";
import { decryptVault } from "../../crypto";

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    let pwd = "";
    process.stdin.on("data", (ch) => {
      const c = ch.toString();
      if (c === "\n" || c === "\r") {
        process.stdin.setRawMode?.(false);
        process.stdout.write("\n");
        rl.close();
        resolve(pwd);
      } else if (c === "\u0003") {
        process.exit();
      } else {
        pwd += c;
      }
    });
  });
}

export interface SchemaEntry {
  key: string;
  required: boolean;
  description?: string;
  example?: string;
}

export function generateSchema(entries: Record<string, string>): SchemaEntry[] {
  return Object.keys(entries).map((key) => ({
    key,
    required: true,
    description: "",
    example: "",
  }));
}

export function getSchemaPath(vaultDir: string): string {
  return path.join(vaultDir, ".envault-schema.json");
}

export function registerSchema(program: Command): void {
  const cmd = program.command("schema").description("Generate or validate a schema for vault entries");

  cmd
    .command("generate")
    .description("Generate a schema file from current vault entries")
    .option("--vault-dir <dir>", "Vault directory", process.cwd())
    .action(async (opts) => {
      if (!vaultExists(opts.vaultDir)) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }
      const password = await promptPassword("Password: ");
      const vaultPath = getVaultPath(opts.vaultDir);
      const raw = fs.readFileSync(vaultPath, "utf-8");
      const data = await decryptVault(raw, password);
      const schema = generateSchema(data);
      const schemaPath = getSchemaPath(opts.vaultDir);
      fs.writeFileSync(schemaPath, JSON.stringify({ entries: schema }, null, 2));
      console.log(`Schema written to ${schemaPath} with ${schema.length} entr${schema.length === 1 ? "y" : "ies"}.`);
    });

  cmd
    .command("validate")
    .description("Validate vault entries against the schema file")
    .option("--vault-dir <dir>", "Vault directory", process.cwd())
    .action(async (opts) => {
      const schemaPath = getSchemaPath(opts.vaultDir);
      if (!fs.existsSync(schemaPath)) {
        console.error("No schema file found. Run `envault schema generate` first.");
        process.exit(1);
      }
      if (!vaultExists(opts.vaultDir)) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }
      const password = await promptPassword("Password: ");
      const vaultPath = getVaultPath(opts.vaultDir);
      const raw = fs.readFileSync(vaultPath, "utf-8");
      const data = await decryptVault(raw, password);
      const schema: { entries: SchemaEntry[] } = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
      const missing = schema.entries.filter((e) => e.required && !(e.key in data));
      if (missing.length === 0) {
        console.log("✔ All required schema keys are present in the vault.");
      } else {
        console.error(`✘ Missing required keys: ${missing.map((e) => e.key).join(", ")}`);
        process.exit(1);
      }
    });
}
