/**
 * Minimal vscode module mock for unit testing.
 * Only stubs what our extension actually uses.
 */
import { vi } from "vitest";

export class Position {
  constructor(
    public readonly line: number,
    public readonly character: number,
  ) {}
}

export class Range {
  constructor(
    public readonly start: Position,
    public readonly end: Position,
  ) {}
}

export class Location {
  constructor(
    public readonly uri: Uri,
    public readonly range: Range,
  ) {}
}

export class Uri {
  private constructor(
    public readonly scheme: string,
    public readonly fsPath: string,
  ) {}

  static file(path: string): Uri {
    return new Uri("file", path);
  }

  static parse(value: string): Uri {
    return new Uri("parsed", value);
  }

  toString(): string {
    return `${this.scheme}://${this.fsPath}`;
  }
}

export class Diagnostic {
  public source?: string;
  public code?: string | number | { value: string | number; target: Uri };
  public tags?: DiagnosticTag[];
  public relatedInformation?: DiagnosticRelatedInformation[];

  constructor(
    public readonly range: Range,
    public readonly message: string,
    public readonly severity?: DiagnosticSeverity,
  ) {}
}

export class DiagnosticRelatedInformation {
  constructor(
    public readonly location: Location,
    public readonly message: string,
  ) {}
}

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}

export enum DiagnosticTag {
  Unnecessary = 1,
  Deprecated = 2,
}

export class ThemeColor {
  constructor(public readonly id: string) {}
}

export enum StatusBarAlignment {
  Left = 1,
  Right = 2,
}

export class CodeAction {
  public diagnostics?: Diagnostic[];
  public isPreferred?: boolean;
  public edit?: WorkspaceEdit;
  public command?: { command: string; title: string };

  constructor(
    public readonly title: string,
    public readonly kind?: CodeActionKind,
  ) {}
}

export class CodeActionKind {
  static readonly QuickFix = new CodeActionKind("quickfix");
  static readonly SourceFixAll = new CodeActionKind("source.fixAll");

  private constructor(public readonly value: string) {}

  append(part: string): CodeActionKind {
    return new CodeActionKind(`${this.value}.${part}`);
  }
}

export class WorkspaceEdit {
  private _edits: Array<{
    type: string;
    uri: Uri;
    range?: Range;
    position?: Position;
    text?: string;
  }> = [];

  insert(uri: Uri, position: Position, text: string): void {
    this._edits.push({ type: "insert", uri, position, text });
  }

  replace(uri: Uri, range: Range, text: string): void {
    this._edits.push({ type: "replace", uri, range, text });
  }

  delete(uri: Uri, range: Range): void {
    this._edits.push({ type: "delete", uri, range });
  }

  get edits() {
    return this._edits;
  }
}

export class TextEdit {
  constructor(
    public readonly range: Range,
    public readonly newText: string,
  ) {}

  static replace(range: Range, newText: string): TextEdit {
    return new TextEdit(range, newText);
  }
}

// --- Stubs for modules the extension imports from vscode ---

function createMockOutputChannel() {
  return {
    appendLine: vi.fn(),
    append: vi.fn(),
    clear: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
  };
}

function createMockStatusBarItem() {
  return {
    text: "",
    tooltip: "",
    command: undefined as string | undefined,
    backgroundColor: undefined as ThemeColor | undefined,
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
  };
}

function createMockDiagnosticCollection() {
  const store = new Map<string, Diagnostic[]>();
  return {
    name: "",
    set: vi.fn((uri: Uri, diagnostics: Diagnostic[]) => {
      store.set(uri.toString(), diagnostics);
    }),
    delete: vi.fn((uri: Uri) => {
      store.delete(uri.toString());
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    get: (uri: Uri) => store.get(uri.toString()),
    dispose: vi.fn(),
    _store: store,
  };
}

export const window = {
  createOutputChannel: vi.fn(() => createMockOutputChannel()),
  createStatusBarItem: vi.fn(() => createMockStatusBarItem()),
  showErrorMessage: vi.fn(() => Promise.resolve(undefined)),
  showWarningMessage: vi.fn(() => Promise.resolve(undefined)),
  showInformationMessage: vi.fn(() => Promise.resolve(undefined)),
  showInputBox: vi.fn(() => Promise.resolve(undefined)),
  showTextDocument: vi.fn(() => Promise.resolve(undefined)),
  activeTextEditor: undefined as
    | { document: { languageId: string; uri: Uri } }
    | undefined,
  visibleTextEditors: [] as Array<{
    document: { languageId: string; uri: Uri };
  }>,
  onDidChangeActiveTextEditor: vi.fn(() => ({ dispose: vi.fn() })),
};

export const workspace = {
  getConfiguration: vi.fn(() => ({
    get: vi.fn((_key: string, defaultValue?: unknown) => defaultValue),
  })),
  workspaceFolders: undefined as
    | Array<{ uri: Uri; name: string; index: number }>
    | undefined,
  createFileSystemWatcher: vi.fn(() => ({
    onDidChange: vi.fn(),
    onDidCreate: vi.fn(),
    onDidDelete: vi.fn(),
    dispose: vi.fn(),
  })),
  onDidSaveTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
  onDidChangeTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
  onDidCloseTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
  onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
  asRelativePath: vi.fn((uri: Uri) => uri.fsPath),
  openTextDocument: vi.fn(() => Promise.resolve(undefined)),
};

export const languages = {
  registerDocumentFormattingEditProvider: vi.fn(() => ({ dispose: vi.fn() })),
  registerCodeActionsProvider: vi.fn(() => ({ dispose: vi.fn() })),
  createDiagnosticCollection: vi.fn((name?: string) => {
    const collection = createMockDiagnosticCollection();
    collection.name = name ?? "";
    return collection;
  }),
};

export const commands = {
  registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
  executeCommand: vi.fn(() => Promise.resolve(undefined)),
};

export const env = {
  openExternal: vi.fn(() => Promise.resolve(true)),
};
