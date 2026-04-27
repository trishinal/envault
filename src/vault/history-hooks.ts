import { appendHistory, HistoryEntry } from "../cli/commands/history";

type Action = "set" | "delete" | "rename" | "rotate" | "import" | "copy";

export function recordHistory(
  vaultDir: string,
  action: Action,
  key: string,
  by?: string
): void {
  const entry: HistoryEntry = {
    timestamp: new Date().toISOString(),
    action,
    key,
    ...(by ? { by } : {}),
  };
  try {
    appendHistory(vaultDir, entry);
  } catch {
    // History recording is best-effort; never block vault operations
  }
}

export function recordBulkHistory(
  vaultDir: string,
  action: Action,
  keys: string[],
  by?: string
): void {
  for (const key of keys) {
    recordHistory(vaultDir, action, key, by);
  }
}
