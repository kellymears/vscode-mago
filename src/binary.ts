import { execFile } from "node:child_process";
import { access, constants } from "node:fs/promises";
import { join } from "node:path";
import * as vscode from "vscode";
import * as logger from "./logger.js";

async function isExecutable(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function which(name: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    execFile("which", [name], (err, stdout) => {
      if (err) {
        resolve(undefined);
      } else {
        resolve(stdout.trim() || undefined);
      }
    });
  });
}

/**
 * Resolve the mago binary path.
 * Order: setting → ./vendor/bin/mago → ./mago → $PATH
 */
export async function resolveBinary(
  workspaceRoot: string,
  settingPath: string,
): Promise<string | undefined> {
  // 1. Explicit setting
  if (settingPath) {
    if (await isExecutable(settingPath)) {
      logger.debug(`Binary found via setting: ${settingPath}`);
      return settingPath;
    }
    logger.warn(
      `Configured binary not found or not executable: ${settingPath}`,
    );
  }

  // 2. Workspace-local paths
  const localCandidates = [
    join(workspaceRoot, "vendor", "bin", "mago"),
    join(workspaceRoot, "mago"),
  ];

  for (const candidate of localCandidates) {
    if (await isExecutable(candidate)) {
      logger.debug(`Binary found locally: ${candidate}`);
      return candidate;
    }
  }

  // 3. System PATH
  const systemPath = await which("mago");
  if (systemPath) {
    logger.debug(`Binary found in PATH: ${systemPath}`);
    return systemPath;
  }

  logger.warn("mago binary not found");
  return undefined;
}

/** Run `mago --version` and return the version string. */
export async function getVersion(binaryPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(binaryPath, ["--version"], { timeout: 5000 }, (err, stdout) => {
      if (err) {
        reject(new Error(`Failed to get mago version: ${err.message}`));
        return;
      }
      // Output: "mago 1.0.0-beta.27"
      const version = stdout.trim().replace(/^mago\s+/, "");
      resolve(version);
    });
  });
}

/** Show a notification that the binary is missing with guidance. */
export function showBinaryMissingError() {
  vscode.window
    .showErrorMessage(
      "Mago binary not found. Install mago or set the path in settings.",
      "Open Settings",
    )
    .then((choice) => {
      if (choice === "Open Settings") {
        vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "mago.bin",
        );
      }
    });
}
