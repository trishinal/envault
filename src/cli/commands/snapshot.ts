import fs from "fs";
import path from "path";
import readline from "readline";
import { decryptVault, encryptVault } from "../../crypto/index.js";
import { getVaultPath, vaultExists } from "../../vault/store.js";
import { assertVaultUnlocked } from "./lock-guard.js";

export function getSnapshotDir(vaultDir: string): string {
  return path.join(vaultDir, ".snapshots");
}

export function getSnapshotPath(vaultDir: string, label: string): string {
  const safe = label.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(getSnapshotDir(vaultDir), `${safe}.vault`);
}

function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(prompt, (ans) => { rl.close(); resolve(ans); }));
}

export function registerSnapshot(program: import("commander").Command) {
  const snap = program.command("snapshot").description("Manage vault snapshots");

  snap
    .command("save <label>")
    .description("Save a named snapshot of the current vault")
    .action(async (label: string) => {
      const vaultDir = process.cwd();
      assertVaultUnlocked(vaultDir);
      if (!vaultExists(vaultDir)) { console.error("No vault found."); process.exit(1); }
      const password = await promptPassword("Password: ");
      const vaultPath = getVaultPath(vaultDir);
      const encrypted = fs.readFileSync(vaultPath, "utf-8");
      await decryptVault(encrypted, password); // verify password
      const snapDir = getSnapshotDir(vaultDir);
      if (!fs.existsSync(snapDir)) fs.mkdirSync(snapDir, { recursive: true });
      const snapPath = getSnapshotPath(vaultDir, label);
      fs.writeFileSync(snapPath, encrypted, "utf-8");
      console.log(`Snapshot "${label}" saved.`);
    });

  snap
    .command("restore <label>")
    .description("Restore vault from a named snapshot")
    .action(async (label: string) => {
      const vaultDir = process.cwd();
      assertVaultUnlocked(vaultDir);
      const snapPath = getSnapshotPath(vaultDir, label);
      if (!fs.existsSync(snapPath)) { console.error(`Snapshot "${label}" not found.`); process.exit(1); }
      const password = await promptPassword("Password: ");
      const encrypted = fs.readFileSync(snapPath, "utf-8");
      const entries = await decryptVault(encrypted, password);
      const newEncrypted = await encryptVault(entries, password);
      fs.writeFileSync(getVaultPath(vaultDir), newEncrypted, "utf-8");
      console.log(`Vault restored from snapshot "${label}".`);
    });

  snap
    .command("list")
    .description("List all saved snapshots")
    .action(() => {
      const vaultDir = process.cwd();
      const snapDir = getSnapshotDir(vaultDir);
      if (!fs.existsSync(snapDir)) { console.log("No snapshots found."); return; }
      const files = fs.readdirSync(snapDir).filter((f) => f.endsWith(".vault"));
      if (files.length === 0) { console.log("No snapshots found."); return; }
      files.forEach((f) => console.log(f.replace(/\.vault$/, "")));
    });

  snap
    .command("delete <label>")
    .description("Delete a named snapshot")
    .action((label: string) => {
      const vaultDir = process.cwd();
      const snapPath = getSnapshotPath(vaultDir, label);
      if (!fs.existsSync(snapPath)) { console.error(`Snapshot "${label}" not found.`); process.exit(1); }
      fs.unlinkSync(snapPath);
      console.log(`Snapshot "${label}" deleted.`);
    });
}
