import { isVaultLocked } from './lock';

/**
 * Checks whether the vault is locked and exits with an error if so.
 * Call this at the start of any command that reads or writes vault data.
 *
 * @param dir - Directory to check for the lock file (defaults to cwd)
 */
export function assertVaultUnlocked(dir: string = process.cwd()): void {
  if (isVaultLocked(dir)) {
    console.error(
      'Error: The vault is currently locked.\n' +
        'Run `envault lock off` to unlock it before proceeding.'
    );
    process.exit(1);
  }
}
