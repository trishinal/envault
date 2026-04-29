import fs from "fs";
import zlib from "zlib";
import { promisify } from "util";
import { Command } from "commander";
import * as readline from "readline";
import { getVaultPath, vaultExists } from "../../vault/store";
import { assertVaultUnlocked } from "./lock-guard";

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    rl.question("", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function compressVault(vaultDir: string): Promise<string> {
  const vaultPath = getVaultPath(vaultDir);
  const raw = fs.readFileSync(vaultPath);
  const compressed = await gzip(raw);
  const outPath = vaultPath + ".gz";
  fs.writeFileSync(outPath, compressed);
  return outPath;
}

export async function decompressVault(compressedPath: string, vaultDir: string): Promise<string> {
  const raw = fs.readFileSync(compressedPath);
  const decompressed = await gunzip(raw);
  const outPath = getVaultPath(vaultDir);
  fs.writeFileSync(outPath, decompressed);
  return outPath;
}

export function registerCompress(program: Command): void {
  const compress = program.command("compress").description("Compress or decompress the vault file");

  compress
    .command("pack")
    .description("Compress the vault to a .gz file")
    .option("--dir <dir>", "Vault directory", process.cwd())
    .action(async (opts) => {
      assertVaultUnlocked(opts.dir);
      if (!vaultExists(opts.dir)) {
        console.error("No vault found. Run 'envault init' first.");
        process.exit(1);
      }
      const outPath = await compressVault(opts.dir);
      console.log(`Vault compressed to: ${outPath}`);
    });

  compress
    .command("unpack <file>")
    .description("Decompress a .gz vault file")
    .option("--dir <dir>", "Vault directory", process.cwd())
    .action(async (file, opts) => {
      assertVaultUnlocked(opts.dir);
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }
      const outPath = await decompressVault(file, opts.dir);
      console.log(`Vault decompressed to: ${outPath}`);
    });
}
