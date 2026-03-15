import * as vscode from "vscode";
import type { MagoSettings } from "./types.js";
import * as logger from "./logger.js";

export function getSettings(): MagoSettings {
  const config = vscode.workspace.getConfiguration("mago");
  return {
    enabled: config.get<boolean>("enabled", true),
    bin: config.get<string>("bin", ""),
    configPath: config.get<string>("configPath", ""),
    phpVersion: config.get<string>("phpVersion", ""),
    lint: {
      enabled: config.get<boolean>("lint.enabled", true),
      run: config.get<"onSave" | "onType">("lint.run", "onSave"),
    },
    analyze: {
      enabled: config.get<boolean>("analyze.enabled", true),
    },
    format: {
      enabled: config.get<boolean>("format.enabled", true),
    },
    trace: {
      level: config.get<"off" | "error" | "warn" | "info" | "debug">(
        "trace.level",
        "info",
      ),
    },
  };
}

/** Watch mago.toml files for changes. */
export function createConfigWatcher(
  onChanged: () => void,
): vscode.FileSystemWatcher {
  const watcher = vscode.workspace.createFileSystemWatcher("**/mago.toml");

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  const debounced = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      logger.info("mago.toml changed — re-running diagnostics");
      onChanged();
    }, 500);
  };

  watcher.onDidChange(debounced);
  watcher.onDidCreate(debounced);
  watcher.onDidDelete(debounced);

  return watcher;
}
