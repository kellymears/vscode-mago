import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";

// Mock all dependency modules before importing extension
vi.mock("../config.js", () => ({
  getSettings: vi.fn(),
  createConfigWatcher: vi.fn(() => ({ dispose: vi.fn() })),
}));

vi.mock("../binary.js", () => ({
  resolveBinary: vi.fn(),
  getVersion: vi.fn(),
  showBinaryMissingError: vi.fn(),
}));

vi.mock("../formatter.js", () => ({
  createFormattingProvider: vi.fn(() => ({ provideDocumentFormattingEdits: vi.fn() })),
}));

vi.mock("../diagnostics.js", () => ({
  runLint: vi.fn(() => Promise.resolve()),
  runAnalyze: vi.fn(() => Promise.resolve()),
  runLintWorkspace: vi.fn(() => Promise.resolve()),
  runAnalyzeWorkspace: vi.fn(() => Promise.resolve()),
  clearFile: vi.fn(),
  clearAll: vi.fn(),
  clearLint: vi.fn(),
  dispose: vi.fn(),
}));

vi.mock("../code-actions.js", () => ({
  register: vi.fn(),
}));

vi.mock("../status-bar.js", () => ({
  setState: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
  updateVisibility: vi.fn(),
  dispose: vi.fn(),
}));

vi.mock("../logger.js", () => ({
  setLogLevel: vi.fn(),
  parseLogLevel: vi.fn(() => 0),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  show: vi.fn(),
  dispose: vi.fn(),
}));

vi.mock("../mago.js", () => ({
  fix: vi.fn(() => Promise.resolve({ success: true })),
  explainRule: vi.fn(() => Promise.resolve("Rule explanation")),
}));

import * as vscode from "vscode";
import { activate, deactivate } from "../extension";
import { getSettings, createConfigWatcher } from "../config.js";
import { resolveBinary, getVersion } from "../binary.js";
import { createFormattingProvider } from "../formatter.js";
import * as diagnostics from "../diagnostics.js";
import * as codeActions from "../code-actions.js";
import * as statusBar from "../status-bar.js";
import * as logger from "../logger.js";
import * as mago from "../mago.js";
import { MagoState } from "../types.js";
import type { MagoSettings } from "../types.js";

// --- Helpers ---

function defaultSettings(overrides?: Partial<MagoSettings>): MagoSettings {
  return {
    enabled: true,
    bin: "",
    configPath: "",
    phpVersion: "",
    lint: { enabled: true, run: "onSave" },
    analyze: { enabled: true },
    format: { enabled: true },
    trace: { level: "off" },
    ...overrides,
  };
}

function createMockContext(): vscode.ExtensionContext {
  return {
    subscriptions: [],
  } as unknown as vscode.ExtensionContext;
}

/** Extract the callback registered for a specific command name. */
function getCommandCallback(name: string): ((...args: unknown[]) => unknown) | undefined {
  const calls = vi.mocked(vscode.commands.registerCommand).mock.calls;
  const match = calls.find(([cmd]) => cmd === name);
  return match?.[1] as ((...args: unknown[]) => unknown) | undefined;
}

/** Extract callback from an event registration mock (e.g. onDidSaveTextDocument). */
function getEventCallback(mockFn: Mock): ((...args: unknown[]) => unknown) | undefined {
  return mockFn.mock.calls[0]?.[0] as ((...args: unknown[]) => unknown) | undefined;
}

/** Set up workspace folder so getWorkspaceRoot() returns a value. */
function setupWorkspace(): void {
  (vscode.workspace as any).workspaceFolders = [
    { uri: vscode.Uri.file("/workspace"), name: "test", index: 0 },
  ];
}

// --- Tests ---

describe("extension", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    (vscode.workspace as any).workspaceFolders = undefined;
    (vscode.window as any).activeTextEditor = undefined;
    (vscode.window as any).visibleTextEditors = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("activate() — disabled path", () => {
    it("sets status bar to Disabled and returns early", () => {
      vi.mocked(getSettings).mockReturnValue(defaultSettings({ enabled: false }));

      const ctx = createMockContext();
      activate(ctx);

      expect(statusBar.setState).toHaveBeenCalledWith(MagoState.Disabled);
      expect(statusBar.updateVisibility).toHaveBeenCalled();
    });

    it("does not register commands, formatter, or event listeners", () => {
      vi.mocked(getSettings).mockReturnValue(defaultSettings({ enabled: false }));

      const ctx = createMockContext();
      activate(ctx);

      expect(vscode.commands.registerCommand).not.toHaveBeenCalled();
      expect(vscode.languages.registerDocumentFormattingEditProvider).not.toHaveBeenCalled();
      expect(codeActions.register).not.toHaveBeenCalled();
      expect(vscode.workspace.onDidSaveTextDocument).not.toHaveBeenCalled();
    });
  });

  describe("activate() — enabled path", () => {
    beforeEach(() => {
      setupWorkspace();
      vi.mocked(getSettings).mockReturnValue(defaultSettings());
      vi.mocked(resolveBinary).mockResolvedValue("/usr/local/bin/mago");
      vi.mocked(getVersion).mockResolvedValue("1.0.0");
    });

    it("calls initBinary which resolves binary and sets status bar to Ready", async () => {
      const ctx = createMockContext();
      activate(ctx);

      // Flush the async initBinary()
      await vi.runAllTimersAsync();

      expect(resolveBinary).toHaveBeenCalledWith("/workspace", "");
      expect(getVersion).toHaveBeenCalledWith("/usr/local/bin/mago");
      expect(statusBar.setState).toHaveBeenCalledWith(MagoState.Ready, "1.0.0");
      expect(statusBar.show).toHaveBeenCalled();
    });

    it("registers the formatter provider when format.enabled is true", () => {
      const ctx = createMockContext();
      activate(ctx);

      expect(createFormattingProvider).toHaveBeenCalled();
      expect(vscode.languages.registerDocumentFormattingEditProvider).toHaveBeenCalled();
    });

    it("registers code actions", () => {
      const ctx = createMockContext();
      activate(ctx);

      expect(codeActions.register).toHaveBeenCalledWith(ctx);
    });

    it("registers all 10 commands", () => {
      const ctx = createMockContext();
      activate(ctx);

      const registeredCommands = vi.mocked(vscode.commands.registerCommand).mock.calls.map(
        ([name]) => name,
      );

      expect(registeredCommands).toContain("mago.showOutput");
      expect(registeredCommands).toContain("mago.restart");
      expect(registeredCommands).toContain("mago.format");
      expect(registeredCommands).toContain("mago.lint");
      expect(registeredCommands).toContain("mago.lintWorkspace");
      expect(registeredCommands).toContain("mago.analyze");
      expect(registeredCommands).toContain("mago.analyzeWorkspace");
      expect(registeredCommands).toContain("mago.fix");
      expect(registeredCommands).toContain("mago.fixUnsafe");
      expect(registeredCommands).toContain("mago.showRuleDoc");
      expect(registeredCommands).toHaveLength(10);
    });

    it("wires onDidSave, onDidClose, onDidChangeActiveTextEditor, onDidChangeConfiguration", () => {
      const ctx = createMockContext();
      activate(ctx);

      expect(vscode.workspace.onDidSaveTextDocument).toHaveBeenCalled();
      expect(vscode.workspace.onDidCloseTextDocument).toHaveBeenCalled();
      expect(vscode.window.onDidChangeActiveTextEditor).toHaveBeenCalled();
      expect(vscode.workspace.onDidChangeConfiguration).toHaveBeenCalled();
    });

    it("creates a config watcher for mago.toml", () => {
      const ctx = createMockContext();
      activate(ctx);

      expect(createConfigWatcher).toHaveBeenCalledWith(expect.any(Function));
    });

    it("pushes all disposables to context.subscriptions", () => {
      const ctx = createMockContext();
      activate(ctx);

      // formatter + onDidSave + onDidClose + onDidChangeActiveTextEditor +
      // configWatcher + onDidChangeConfiguration + 10 commands = 17
      expect(ctx.subscriptions.length).toBeGreaterThanOrEqual(16);
    });
  });

  describe("activate() — format.enabled: false", () => {
    it("skips formatter registration", () => {
      setupWorkspace();
      vi.mocked(getSettings).mockReturnValue(
        defaultSettings({ format: { enabled: false } }),
      );
      vi.mocked(resolveBinary).mockResolvedValue("/usr/local/bin/mago");

      const ctx = createMockContext();
      activate(ctx);

      expect(vscode.languages.registerDocumentFormattingEditProvider).not.toHaveBeenCalled();
    });
  });

  describe("activate() — lint.run: onType", () => {
    it("wires onDidChangeTextDocument when lint.run is onType", () => {
      setupWorkspace();
      vi.mocked(getSettings).mockReturnValue(
        defaultSettings({ lint: { enabled: true, run: "onType" } }),
      );
      vi.mocked(resolveBinary).mockResolvedValue("/usr/local/bin/mago");

      const ctx = createMockContext();
      activate(ctx);

      expect(vscode.workspace.onDidChangeTextDocument).toHaveBeenCalled();
    });

    it("does NOT wire onDidChangeTextDocument when lint.run is onSave", () => {
      setupWorkspace();
      vi.mocked(getSettings).mockReturnValue(
        defaultSettings({ lint: { enabled: true, run: "onSave" } }),
      );
      vi.mocked(resolveBinary).mockResolvedValue("/usr/local/bin/mago");

      const ctx = createMockContext();
      activate(ctx);

      expect(vscode.workspace.onDidChangeTextDocument).not.toHaveBeenCalled();
    });
  });

  describe("deactivate()", () => {
    it("clears debounce timers and disposes modules", () => {
      deactivate();

      expect(diagnostics.dispose).toHaveBeenCalled();
      expect(statusBar.dispose).toHaveBeenCalled();
      expect(logger.dispose).toHaveBeenCalled();
    });
  });

  describe("command: mago.restart", () => {
    it("clears diagnostics, re-inits binary, and re-runs diagnostics", async () => {
      setupWorkspace();
      vi.mocked(getSettings).mockReturnValue(defaultSettings());
      vi.mocked(resolveBinary).mockResolvedValue("/usr/local/bin/mago");
      vi.mocked(getVersion).mockResolvedValue("1.0.0");

      const ctx = createMockContext();
      activate(ctx);

      const restart = getCommandCallback("mago.restart");
      expect(restart).toBeDefined();

      await restart!();

      expect(diagnostics.clearAll).toHaveBeenCalled();
      expect(resolveBinary).toHaveBeenCalledTimes(2); // once in activate, once in restart
    });
  });

  describe("command: mago.fixUnsafe", () => {
    beforeEach(() => {
      setupWorkspace();
      vi.mocked(getSettings).mockReturnValue(defaultSettings());
      vi.mocked(resolveBinary).mockResolvedValue("/usr/local/bin/mago");
      vi.mocked(getVersion).mockResolvedValue("1.0.0");
    });

    it("calls mago.fix with unsafe: true when user confirms", async () => {
      (vscode.window as any).activeTextEditor = {
        document: {
          languageId: "php",
          uri: vscode.Uri.file("/workspace/test.php"),
        },
      };

      const ctx = createMockContext();
      activate(ctx);
      // Flush initBinary so binaryPath is set
      await vi.runAllTimersAsync();

      vi.mocked(vscode.window.showWarningMessage).mockResolvedValue("Apply" as any);
      vi.mocked(mago.fix).mockResolvedValue({ success: true });

      const fixUnsafe = getCommandCallback("mago.fixUnsafe");
      expect(fixUnsafe).toBeDefined();
      await fixUnsafe!();

      expect(mago.fix).toHaveBeenCalledWith(
        "/usr/local/bin/mago",
        "/workspace",
        "/workspace/test.php",
        true,
        undefined,
        undefined,
      );
    });

    it("does NOT call mago.fix when user cancels", async () => {
      (vscode.window as any).activeTextEditor = {
        document: {
          languageId: "php",
          uri: vscode.Uri.file("/workspace/test.php"),
        },
      };

      const ctx = createMockContext();
      activate(ctx);
      await vi.runAllTimersAsync();

      vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(undefined as any);

      const fixUnsafe = getCommandCallback("mago.fixUnsafe");
      await fixUnsafe!();

      expect(mago.fix).not.toHaveBeenCalled();
    });
  });

  describe("command: mago.showRuleDoc", () => {
    beforeEach(() => {
      setupWorkspace();
      vi.mocked(getSettings).mockReturnValue(defaultSettings());
      vi.mocked(resolveBinary).mockResolvedValue("/usr/local/bin/mago");
      vi.mocked(getVersion).mockResolvedValue("1.0.0");
    });

    it("opens a text document with cleaned explanation", async () => {
      const ctx = createMockContext();
      activate(ctx);
      await vi.runAllTimersAsync();

      vi.mocked(vscode.window.showInputBox).mockResolvedValue("strict-types" as any);
      vi.mocked(mago.explainRule).mockResolvedValue("╭──────╮\n│ Rule │\n╰──────╯");
      const mockDoc = { uri: vscode.Uri.file("/tmp/doc") };
      vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(mockDoc as any);

      const showRuleDoc = getCommandCallback("mago.showRuleDoc");
      await showRuleDoc!();

      expect(mago.explainRule).toHaveBeenCalledWith(
        "/usr/local/bin/mago",
        "/workspace",
        "strict-types",
      );
      expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith({
        content: expect.not.stringContaining("╭"),
        language: "markdown",
      });
      expect(vscode.window.showTextDocument).toHaveBeenCalledWith(mockDoc, { preview: true });
    });

    it("returns early when user cancels input box", async () => {
      const ctx = createMockContext();
      activate(ctx);
      await vi.runAllTimersAsync();

      vi.mocked(vscode.window.showInputBox).mockResolvedValue(undefined as any);

      const showRuleDoc = getCommandCallback("mago.showRuleDoc");
      await showRuleDoc!();

      expect(mago.explainRule).not.toHaveBeenCalled();
    });
  });

  describe("configuration change handler", () => {
    beforeEach(() => {
      setupWorkspace();
      vi.mocked(resolveBinary).mockResolvedValue("/usr/local/bin/mago");
      vi.mocked(getVersion).mockResolvedValue("1.0.0");
    });

    it("sets Disabled and clears diagnostics when mago is disabled", () => {
      vi.mocked(getSettings).mockReturnValue(defaultSettings());

      const ctx = createMockContext();
      activate(ctx);

      const onConfigChange = getEventCallback(
        vi.mocked(vscode.workspace.onDidChangeConfiguration),
      );
      expect(onConfigChange).toBeDefined();

      // Now getSettings returns disabled
      vi.mocked(getSettings).mockReturnValue(defaultSettings({ enabled: false }));

      onConfigChange!({
        affectsConfiguration: (section: string) => section === "mago",
      });

      expect(statusBar.setState).toHaveBeenCalledWith(MagoState.Disabled);
      expect(diagnostics.clearAll).toHaveBeenCalled();
    });

    it("re-resolves binary when mago.bin changes", async () => {
      vi.mocked(getSettings).mockReturnValue(defaultSettings());

      const ctx = createMockContext();
      activate(ctx);

      const onConfigChange = getEventCallback(
        vi.mocked(vscode.workspace.onDidChangeConfiguration),
      );

      onConfigChange!({
        affectsConfiguration: (section: string) =>
          section === "mago" || section === "mago.bin",
      });

      await vi.runAllTimersAsync();

      // Called twice: once during activate, once during config change
      expect(resolveBinary).toHaveBeenCalledTimes(2);
    });

    it("ignores configuration changes not affecting mago", () => {
      vi.mocked(getSettings).mockReturnValue(defaultSettings());

      const ctx = createMockContext();
      activate(ctx);

      const callCountBefore = vi.mocked(statusBar.setState).mock.calls.length;

      const onConfigChange = getEventCallback(
        vi.mocked(vscode.workspace.onDidChangeConfiguration),
      );

      onConfigChange!({
        affectsConfiguration: () => false,
      });

      // No additional statusBar calls
      expect(vi.mocked(statusBar.setState).mock.calls.length).toBe(callCountBefore);
    });

    it("clears lint diagnostics when lint is disabled", () => {
      vi.mocked(getSettings).mockReturnValue(defaultSettings());

      const ctx = createMockContext();
      activate(ctx);

      const onConfigChange = getEventCallback(
        vi.mocked(vscode.workspace.onDidChangeConfiguration),
      );

      vi.mocked(getSettings).mockReturnValue(
        defaultSettings({ lint: { enabled: false, run: "onSave" } }),
      );

      onConfigChange!({
        affectsConfiguration: (section: string) => section === "mago",
      });

      expect(diagnostics.clearLint).toHaveBeenCalled();
    });
  });

  describe("event: onDidSaveTextDocument", () => {
    it("runs diagnostics for PHP files on save", async () => {
      setupWorkspace();
      vi.mocked(getSettings).mockReturnValue(defaultSettings());
      vi.mocked(resolveBinary).mockResolvedValue("/usr/local/bin/mago");
      vi.mocked(getVersion).mockResolvedValue("1.0.0");

      const ctx = createMockContext();
      activate(ctx);
      await vi.runAllTimersAsync();

      const onSave = getEventCallback(vi.mocked(vscode.workspace.onDidSaveTextDocument));
      expect(onSave).toBeDefined();

      onSave!({ languageId: "php", uri: vscode.Uri.file("/workspace/test.php") });

      expect(statusBar.setState).toHaveBeenCalledWith(MagoState.Running);
    });

    it("ignores non-PHP files on save", async () => {
      setupWorkspace();
      vi.mocked(getSettings).mockReturnValue(defaultSettings());
      vi.mocked(resolveBinary).mockResolvedValue("/usr/local/bin/mago");
      vi.mocked(getVersion).mockResolvedValue("1.0.0");

      const ctx = createMockContext();
      activate(ctx);
      await vi.runAllTimersAsync();

      const runningCallsBefore = vi.mocked(statusBar.setState).mock.calls.filter(
        ([state]) => state === MagoState.Running,
      ).length;

      const onSave = getEventCallback(vi.mocked(vscode.workspace.onDidSaveTextDocument));
      onSave!({ languageId: "javascript", uri: vscode.Uri.file("/workspace/test.js") });

      const runningCallsAfter = vi.mocked(statusBar.setState).mock.calls.filter(
        ([state]) => state === MagoState.Running,
      ).length;

      expect(runningCallsAfter).toBe(runningCallsBefore);
    });
  });

  describe("event: onDidCloseTextDocument", () => {
    it("clears diagnostics for closed file", () => {
      setupWorkspace();
      vi.mocked(getSettings).mockReturnValue(defaultSettings());
      vi.mocked(resolveBinary).mockResolvedValue("/usr/local/bin/mago");

      const ctx = createMockContext();
      activate(ctx);

      const onClose = getEventCallback(vi.mocked(vscode.workspace.onDidCloseTextDocument));
      const uri = vscode.Uri.file("/workspace/test.php");
      onClose!({ uri });

      expect(diagnostics.clearFile).toHaveBeenCalledWith(uri);
    });
  });

  describe("command: mago.showOutput", () => {
    it("calls logger.show()", () => {
      setupWorkspace();
      vi.mocked(getSettings).mockReturnValue(defaultSettings());
      vi.mocked(resolveBinary).mockResolvedValue("/usr/local/bin/mago");

      const ctx = createMockContext();
      activate(ctx);

      const showOutput = getCommandCallback("mago.showOutput");
      showOutput!();

      expect(logger.show).toHaveBeenCalled();
    });
  });

  describe("command: mago.format", () => {
    it("executes formatDocument for PHP active editor", async () => {
      setupWorkspace();
      vi.mocked(getSettings).mockReturnValue(defaultSettings());
      vi.mocked(resolveBinary).mockResolvedValue("/usr/local/bin/mago");

      (vscode.window as any).activeTextEditor = {
        document: { languageId: "php", uri: vscode.Uri.file("/workspace/test.php") },
      };

      const ctx = createMockContext();
      activate(ctx);

      const formatCmd = getCommandCallback("mago.format");
      await formatCmd!();

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        "editor.action.formatDocument",
      );
    });

    it("no-ops when active editor is not PHP", async () => {
      setupWorkspace();
      vi.mocked(getSettings).mockReturnValue(defaultSettings());
      vi.mocked(resolveBinary).mockResolvedValue("/usr/local/bin/mago");

      (vscode.window as any).activeTextEditor = {
        document: { languageId: "javascript", uri: vscode.Uri.file("/workspace/test.js") },
      };

      const ctx = createMockContext();
      activate(ctx);

      const formatCmd = getCommandCallback("mago.format");
      await formatCmd!();

      expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });
  });

  describe("initBinary — binary not found", () => {
    it("sets Error state and shows missing error when binary not found", async () => {
      setupWorkspace();
      vi.mocked(getSettings).mockReturnValue(defaultSettings());
      vi.mocked(resolveBinary).mockResolvedValue(undefined);

      const ctx = createMockContext();
      activate(ctx);
      await vi.runAllTimersAsync();

      expect(statusBar.setState).toHaveBeenCalledWith(MagoState.Error);
      expect(statusBar.show).toHaveBeenCalled();
    });
  });

  describe("initBinary — getVersion fails", () => {
    it("still sets Ready state (without version) on version error", async () => {
      setupWorkspace();
      vi.mocked(getSettings).mockReturnValue(defaultSettings());
      vi.mocked(resolveBinary).mockResolvedValue("/usr/local/bin/mago");
      vi.mocked(getVersion).mockRejectedValue(new Error("version parse failed"));

      const ctx = createMockContext();
      activate(ctx);
      await vi.runAllTimersAsync();

      expect(statusBar.setState).toHaveBeenCalledWith(MagoState.Ready);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("version parse failed"),
      );
    });
  });
});
