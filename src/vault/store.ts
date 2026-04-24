import * as fs from 'fs';
import * as path from 'path';
import { encryptVault, decryptVault } from '../crypto/index';

export interface VaultData {
  version: number;
  entries: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_VAULT_PATH = '.envault';
const VAULT_VERSION = 1;

export function getVaultPath(dir: string = process.cwd()): string {
  return path.join(dir, DEFAULT_VAULT_PATH);
}

export function vaultExists(dir?: string): boolean {
  return fs.existsSync(getVaultPath(dir));
}

export function initVault(): VaultData {
  return {
    version: VAULT_VERSION,
    entries: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function saveVault(
  data: VaultData,
  passphrase: string,
  dir?: string
): Promise<void> {
  const vaultPath = getVaultPath(dir);
  data.updatedAt = new Date().toISOString();
  const encrypted = await encryptVault(data, passphrase);
  fs.writeFileSync(vaultPath, encrypted, 'utf-8');
}

export async function loadVault(
  passphrase: string,
  dir?: string
): Promise<VaultData> {
  const vaultPath = getVaultPath(dir);
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`No vault found at ${vaultPath}. Run 'envault init' first.`);
  }
  const encrypted = fs.readFileSync(vaultPath, 'utf-8');
  return decryptVault(encrypted, passphrase) as Promise<VaultData>;
}
