import * as vscode from "vscode";
import * as mago from "./mago.js";
import * as logger from "./logger.js";

export function createFormattingProvider(
  getBinaryPath: () => string | undefined,
  getWorkspaceRoot: () => string | undefined,
  getConfigPath: () => string | undefined,
  getPhpVersion: () => string | undefined,
  onRunning: () => void,
  onDone: () => void,
): vscode.DocumentFormattingEditProvider {
  return {
    async provideDocumentFormattingEdits(
      document: vscode.TextDocument,
      _options: vscode.FormattingOptions,
      token: vscode.CancellationToken,
    ): Promise<vscode.TextEdit[]> {
      const binaryPath = getBinaryPath();
      const workspaceRoot = getWorkspaceRoot();

      if (!binaryPath || !workspaceRoot) {
        logger.warn("Format skipped: no binary or workspace root");
        return [];
      }

      const original = document.getText();

      if (token.isCancellationRequested) return [];

      onRunning();
      try {
        const result = await mago.format(
          binaryPath,
          workspaceRoot,
          original,
          getConfigPath(),
          getPhpVersion(),
        );

        if (token.isCancellationRequested) return [];

        if (result.error) {
          logger.error(`Format error: ${result.error}`);
          return [];
        }

        if (result.formatted === original) return [];

        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(original.length),
        );
        return [vscode.TextEdit.replace(fullRange, result.formatted)];
      } finally {
        onDone();
      }
    },
  };
}
