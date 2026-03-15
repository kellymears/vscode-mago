import * as vscode from "vscode";
import { MagoState } from "./types.js";
import { getSettings, createConfigWatcher } from "./config.js";
import { resolveBinary, getVersion, showBinaryMissingError } from "./binary.js";
import { createFormattingProvider } from "./formatter.js";
import * as diagnostics from "./diagnostics.js";
import * as codeActions from "./code-actions.js";
import * as statusBar from "./status-bar.js";
import * as logger from "./logger.js";
import { parseLogLevel } from "./logger.js";
import * as mago from "./mago.js";

const PHP_SELECTOR: vscode.DocumentSelector = {
  language: "php",
  scheme: "file",
};

// Per-workspace state
let binaryPath: string | undefined;
let binaryVersion: string | undefined;
let debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

function getWorkspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function getConfigPath(): string | undefined {
  const s = getSettings();
  return s.configPath || undefined;
}

function getPhpVersion(): string | undefined {
  const s = getSettings();
  return s.phpVersion || undefined;
}

async function initBinary(): Promise<void> {
  const root = getWorkspaceRoot();
  if (!root) return;

  const settings = getSettings();
  binaryPath = await resolveBinary(root, settings.bin);

  if (!binaryPath) {
    statusBar.setState(MagoState.Error);
    statusBar.show();
    showBinaryMissingError();
    return;
  }

  try {
    binaryVersion = await getVersion(binaryPath);
    logger.info(`Resolved mago ${binaryVersion} at ${binaryPath}`);
    statusBar.setState(MagoState.Ready, binaryVersion);
  } catch (e) {
    logger.error(
      `Failed to get version: ${e instanceof Error ? e.message : String(e)}`,
    );
    binaryVersion = undefined;
    statusBar.setState(MagoState.Ready);
  }

  statusBar.show();
}

function runDiagnosticsForDocument(document: vscode.TextDocument): void {
  if (document.languageId !== "php" || !binaryPath) return;

  const root = getWorkspaceRoot();
  if (!root) return;

  const settings = getSettings();
  const configPath = getConfigPath();
  const phpVersion = getPhpVersion();

  statusBar.setState(MagoState.Running);

  const promises: Promise<void>[] = [];

  if (settings.lint.enabled) {
    promises.push(
      diagnostics.runLint(document, binaryPath, root, configPath, phpVersion),
    );
  }

  if (settings.analyze.enabled) {
    promises.push(
      diagnostics.runAnalyze(
        document,
        binaryPath,
        root,
        configPath,
        phpVersion,
      ),
    );
  }

  void Promise.allSettled(promises).then(() => {
    statusBar.setState(MagoState.Ready, binaryVersion);
  });
}

function runDiagnosticsDebounced(document: vscode.TextDocument): void {
  const key = document.uri.toString();
  const existing = debounceTimers.get(key);
  if (existing) clearTimeout(existing);

  debounceTimers.set(
    key,
    setTimeout(() => {
      debounceTimers.delete(key);
      runDiagnosticsForDocument(document);
    }, 300),
  );
}

function runDiagnosticsForOpenPhpFiles(): void {
  for (const editor of vscode.window.visibleTextEditors) {
    if (editor.document.languageId === "php") {
      runDiagnosticsForDocument(editor.document);
    }
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const settings = getSettings();

  // Logger setup
  logger.setLogLevel(parseLogLevel(settings.trace.level));

  if (!settings.enabled) {
    statusBar.setState(MagoState.Disabled);
    statusBar.updateVisibility();
    logger.info("Mago is disabled via settings");
    return;
  }

  // Init binary (async, non-blocking)
  void initBinary().then(() => {
    // Run initial diagnostics for any open PHP files
    runDiagnosticsForOpenPhpFiles();
  });

  // Register formatter
  if (settings.format.enabled) {
    context.subscriptions.push(
      vscode.languages.registerDocumentFormattingEditProvider(
        PHP_SELECTOR,
        createFormattingProvider(
          () => binaryPath,
          getWorkspaceRoot,
          getConfigPath,
          getPhpVersion,
          () => statusBar.setState(MagoState.Running),
          () => statusBar.setState(MagoState.Ready, binaryVersion),
        ),
      ),
    );
  }

  // Register code actions
  codeActions.register(context);

  // On-save diagnostics
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (document.languageId === "php") {
        runDiagnosticsForDocument(document);
      }
    }),
  );

  // On-type diagnostics (if configured)
  if (settings.lint.run === "onType") {
    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.document.languageId === "php") {
          runDiagnosticsDebounced(event.document);
        }
      }),
    );
  }

  // Clear diagnostics when file is closed
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => {
      diagnostics.clearFile(document.uri);
    }),
  );

  // Status bar visibility
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      statusBar.updateVisibility();
    }),
  );
  statusBar.updateVisibility();

  // Config watcher
  const configWatcher = createConfigWatcher(() => {
    runDiagnosticsForOpenPhpFiles();
  });
  context.subscriptions.push(configWatcher);

  // Settings change handler
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("mago")) return;

      const newSettings = getSettings();
      logger.setLogLevel(parseLogLevel(newSettings.trace.level));

      if (!newSettings.enabled) {
        statusBar.setState(MagoState.Disabled);
        diagnostics.clearAll();
        return;
      }

      if (!newSettings.lint.enabled) {
        diagnostics.clearLint();
      }

      // Re-resolve binary if bin setting changed
      if (event.affectsConfiguration("mago.bin")) {
        void initBinary().then(() => runDiagnosticsForOpenPhpFiles());
      }
    }),
  );

  // --- Commands ---

  context.subscriptions.push(
    vscode.commands.registerCommand("mago.showOutput", () => {
      logger.show();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mago.restart", async () => {
      diagnostics.clearAll();
      await initBinary();
      runDiagnosticsForOpenPhpFiles();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mago.format", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== "php") return;
      await vscode.commands.executeCommand("editor.action.formatDocument");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mago.lint", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== "php") return;
      runDiagnosticsForDocument(editor.document);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mago.lintWorkspace", async () => {
      const root = getWorkspaceRoot();
      if (!binaryPath || !root) return;
      statusBar.setState(MagoState.Running);
      await diagnostics.runLintWorkspace(
        binaryPath,
        root,
        getConfigPath(),
        getPhpVersion(),
      );
      statusBar.setState(MagoState.Ready, binaryVersion);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mago.analyze", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== "php" || !binaryPath)
        return;
      const root = getWorkspaceRoot();
      if (!root) return;
      statusBar.setState(MagoState.Running);
      void diagnostics
        .runAnalyze(
          editor.document,
          binaryPath,
          root,
          getConfigPath(),
          getPhpVersion(),
        )
        .then(() => statusBar.setState(MagoState.Ready, binaryVersion));
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mago.analyzeWorkspace", async () => {
      const root = getWorkspaceRoot();
      if (!binaryPath || !root) return;
      statusBar.setState(MagoState.Running);
      await diagnostics.runAnalyzeWorkspace(
        binaryPath,
        root,
        getConfigPath(),
        getPhpVersion(),
      );
      statusBar.setState(MagoState.Ready, binaryVersion);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mago.fix", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== "php" || !binaryPath)
        return;
      const root = getWorkspaceRoot();
      if (!root) return;

      statusBar.setState(MagoState.Running);
      const result = await mago.fix(
        binaryPath,
        root,
        editor.document.uri.fsPath,
        false,
        getConfigPath(),
        getPhpVersion(),
      );
      statusBar.setState(MagoState.Ready, binaryVersion);

      if (result.error) {
        void vscode.window.showErrorMessage(`Mago fix failed: ${result.error}`);
      } else {
        runDiagnosticsForDocument(editor.document);
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mago.fixUnsafe", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== "php" || !binaryPath)
        return;
      const root = getWorkspaceRoot();
      if (!root) return;

      const confirm = await vscode.window.showWarningMessage(
        "Apply all fixes including unsafe ones?",
        { modal: true },
        "Apply",
      );
      if (confirm !== "Apply") return;

      statusBar.setState(MagoState.Running);
      const result = await mago.fix(
        binaryPath,
        root,
        editor.document.uri.fsPath,
        true,
        getConfigPath(),
        getPhpVersion(),
      );
      statusBar.setState(MagoState.Ready, binaryVersion);

      if (result.error) {
        void vscode.window.showErrorMessage(`Mago fix failed: ${result.error}`);
      } else {
        runDiagnosticsForDocument(editor.document);
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mago.showRuleDoc", async () => {
      const root = getWorkspaceRoot();
      if (!binaryPath || !root) return;

      const input = await vscode.window.showInputBox({
        prompt: "Enter a mago lint rule code (e.g. strict-types)",
        placeHolder: "rule-code",
      });
      if (!input) return;

      const explanation = await mago.explainRule(binaryPath, root, input);

      // Strip box-drawing characters for cleaner display
      const cleaned = explanation
        .replace(/[╭╮╰╯│─┌┐└┘├┤┬┴┼]/g, "")
        .replace(/^\s{2}/gm, "");

      const doc = await vscode.workspace.openTextDocument({
        content: cleaned,
        language: "markdown",
      });
      await vscode.window.showTextDocument(doc, { preview: true });
    }),
  );

  logger.info("Mago extension activated");
}

export function deactivate(): void {
  for (const timer of debounceTimers.values()) {
    clearTimeout(timer);
  }
  debounceTimers.clear();
  diagnostics.dispose();
  statusBar.dispose();
  logger.dispose();
}
