import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  Diagnostic,
  DiagnosticSeverity,
  Range,
  Position,
  CodeActionKind,
} from "../__mocks__/vscode";
import {
  createMockDocument,
  createFixableIssue,
  createUnsafeFixableIssue,
  createDeleteFixableIssue,
  createTestIssue,
} from "./helpers";

vi.mock("../diagnostics", () => ({ getIssueForDiagnostic: vi.fn() }));

import { getIssueForDiagnostic } from "../diagnostics";
import { createCodeActionProvider, register } from "../code-actions";
import * as vscode from "vscode";

const mockDoc = createMockDocument(
  "<?php\nif ($x == true) {\n  echo 'hi';\n}\n",
);

function createDiagnostic(code: string, source = "mago"): Diagnostic {
  const diag = new Diagnostic(
    new Range(new Position(1, 6), new Position(1, 8)),
    "Test diagnostic",
    DiagnosticSeverity.Warning,
  );
  diag.source = source;
  diag.code = code;
  return diag;
}

const emptyRange = new Range(new Position(0, 0), new Position(0, 0)) as any;

function createContext(diagnostics: Diagnostic[]) {
  return {
    diagnostics,
    only: undefined,
    triggerKind: 1,
  } as any;
}

describe("code-actions", () => {
  const provider = createCodeActionProvider();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns no actions for non-mago diagnostics", () => {
    const diag = createDiagnostic("some-rule", "other-source");
    const actions = provider.provideCodeActions!(
      mockDoc as any,
      emptyRange,
      createContext([diag]),
      {} as any,
    );

    expect(actions).toEqual([]);
  });

  it("returns no actions when the issue has no suggestions", () => {
    const diag = createDiagnostic("strict-types");
    vi.mocked(getIssueForDiagnostic).mockReturnValue(createTestIssue());

    const actions = provider.provideCodeActions!(
      mockDoc as any,
      emptyRange,
      createContext([diag]),
      {} as any,
    );

    expect(actions).toEqual([]);
  });

  it("creates a quick fix for a safe Replace suggestion", () => {
    const diag = createDiagnostic("identity-comparison");
    vi.mocked(getIssueForDiagnostic).mockReturnValue(createFixableIssue());

    const actions = provider.provideCodeActions!(
      mockDoc as any,
      emptyRange,
      createContext([diag]),
      {} as any,
    ) as any[];

    expect(actions).toHaveLength(1);
    expect(actions[0].title).toBe("Fix: identity-comparison");
    expect(actions[0].kind).toBe(CodeActionKind.QuickFix);
    expect(actions[0].isPreferred).toBe(true);
    expect(actions[0].edit).toBeDefined();
    expect(actions[0].edit.edits).toHaveLength(1);
    expect(actions[0].edit.edits[0].type).toBe("replace");
    expect(actions[0].edit.edits[0].text).toBe("===");
  });

  it("labels potentially unsafe fixes appropriately", () => {
    const diag = createDiagnostic("strict-types");
    vi.mocked(getIssueForDiagnostic).mockReturnValue(
      createUnsafeFixableIssue(),
    );

    const actions = provider.provideCodeActions!(
      mockDoc as any,
      emptyRange,
      createContext([diag]),
      {} as any,
    ) as any[];

    expect(actions).toHaveLength(1);
    expect(actions[0].title).toContain("potentially unsafe");
    expect(actions[0].isPreferred).toBe(false);
  });

  it("creates an insert edit for Insert operations", () => {
    const diag = createDiagnostic("strict-types");
    vi.mocked(getIssueForDiagnostic).mockReturnValue(
      createUnsafeFixableIssue(),
    );

    const actions = provider.provideCodeActions!(
      mockDoc as any,
      emptyRange,
      createContext([diag]),
      {} as any,
    ) as any[];

    const edit = actions[0].edit;
    expect(edit.edits).toHaveLength(1);
    expect(edit.edits[0].type).toBe("insert");
    expect(edit.edits[0].text).toContain("declare(strict_types=1)");
  });

  it("attaches the diagnostic to the action", () => {
    const diag = createDiagnostic("identity-comparison");
    vi.mocked(getIssueForDiagnostic).mockReturnValue(createFixableIssue());

    const actions = provider.provideCodeActions!(
      mockDoc as any,
      emptyRange,
      createContext([diag]),
      {} as any,
    ) as any[];

    expect(actions[0].diagnostics).toContain(diag);
  });

  it("creates a delete edit for Delete operations", () => {
    const diag = createDiagnostic("redundant-code");
    vi.mocked(getIssueForDiagnostic).mockReturnValue(
      createDeleteFixableIssue(),
    );

    const actions = provider.provideCodeActions!(
      mockDoc as any,
      emptyRange,
      createContext([diag]),
      {} as any,
    ) as any[];

    expect(actions).toHaveLength(1);
    expect(actions[0].edit.edits).toHaveLength(1);
    expect(actions[0].edit.edits[0].type).toBe("delete");
  });

  it("labels unsafe fixes with (unsafe) and sets a command", () => {
    const diag = createDiagnostic("redundant-code");
    vi.mocked(getIssueForDiagnostic).mockReturnValue(
      createDeleteFixableIssue(),
    );

    const actions = provider.provideCodeActions!(
      mockDoc as any,
      emptyRange,
      createContext([diag]),
      {} as any,
    ) as any[];

    expect(actions[0].title).toContain("unsafe");
    expect(actions[0].isPreferred).toBe(false);
    expect(actions[0].command).toBeDefined();
  });

  it("register() registers a code action provider", () => {
    const subscriptions: any[] = [];
    const context = { subscriptions } as any;

    register(context);

    expect(vscode.languages.registerCodeActionsProvider).toHaveBeenCalledWith(
      { language: "php", scheme: "file" },
      expect.any(Object),
      expect.objectContaining({
        providedCodeActionKinds: expect.any(Array),
      }),
    );
    expect(subscriptions).toHaveLength(1);
  });

  it("returns undefined from getIssueForDiagnostic for unknown diagnostics", () => {
    const diag = createDiagnostic("unknown");
    vi.mocked(getIssueForDiagnostic).mockReturnValue(undefined);

    const actions = provider.provideCodeActions!(
      mockDoc as any,
      emptyRange,
      createContext([diag]),
      {} as any,
    ) as any[];

    expect(actions).toEqual([]);
  });
});
