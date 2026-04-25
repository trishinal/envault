import fs from "fs";
import path from "path";
import readline from "readline";
import { decryptVault } from "../../crypto/index.js";
import { getVaultPath, vaultExists } from "../../vault/store.js";
import { listEntries } from "../../vault/entries.js";
import type { Argv } from "yargs";

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

export interface AuditResult {
  key: string;
  issues: string[];
}

export function auditEntries(entries: Record<string, string>): AuditResult[] {
  const results: AuditResult[] = [];
  for (const [key, value] of Object.entries(entries)) {
    const issues: string[] = [];
    if (value.trim() === "") issues.push("empty value");
    if (value.length < 8) issues.push("value too short (< 8 chars)");
    if (/password|secret|key/i.test(key) && value.length < 16)
      issues.push("sensitive key has weak value (< 16 chars)");
    if (/^[a-z]/.test(key)) issues.push("key is not uppercase");
    if (issues.length > 0) results.push({ key, issues });
  }
  return results;
}

export function registerAudit(yargs: Argv): void {
  yargs.command(
    "audit",
    "Audit vault entries for common issues",
    {},
    async () => {
      const vaultPath = getVaultPath();
      if (!vaultExists()) {
        console.error("No vault found. Run `envault init` first.");
        process.exit(1);
      }
      const password = await promptPassword("Vault password: ");
      const encrypted = fs.readFileSync(vaultPath, "utf-8");
      let entries: Record<string, string>;
      try {
        const vault = await decryptVault(encrypted, password);
        entries = vault.entries ?? {};
      } catch {
        console.error("Failed to decrypt vault. Wrong password?");
        process.exit(1);
      }
      const results = auditEntries(entries);
      if (results.length === 0) {
        console.log("✅ No issues found in vault entries.");
        return;
      }
      console.log(`⚠️  Found issues in ${results.length} entry/entries:\n`);
      for (const { key, issues } of results) {
        console.log(`  ${key}`);
        for (const issue of issues) {
          console.log(`    - ${issue}`);
        }
      }
    }
  );
}
