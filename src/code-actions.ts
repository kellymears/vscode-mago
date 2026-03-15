import * as vscode from "vscode";
import type { MagoIssue, MagoSuggestionOperation } from "./types.js";
import { getIssueForDiagnostic } from "./diagnostics.js";

const PHP_SELECTOR: vscode.DocumentSelector = {
  language: "php",
  scheme: "file",
};

export function createCodeActionProvider(): vscode.CodeActionProvider {
  return {
    provideCodeActions(
      document: vscode.TextDocument,
      _range: vscode.Range,
      context: vscode.CodeActionContext,
      _token: vscode.CancellationToken,
    ): vscode.CodeAction[] {
      const actions: vscode.CodeAction[] = [];

      for (const diagnostic of context.diagnostics) {
        if (diagnostic.source !== "mago") continue;

        const issue = getIssueForDiagnostic(diagnostic);
        if (!issue?.suggestions || issue.suggestions.length === 0) continue;

        const fixActions = createFixActions(document, diagnostic, issue);
        actions.push(...fixActions);
      }

      return actions;
    },
  };
}

function createFixActions(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
  issue: MagoIssue,
): vscode.CodeAction[] {
  const actions: vscode.CodeAction[] = [];

  if (!issue.suggestions) return actions;

  for (const [, suggestion] of issue.suggestions) {
    const isSafe = suggestion.operations.every(
      (op) => getSafetyType(op) === "Safe",
    );
    const isPotentiallyUnsafe = suggestion.operations.some(
      (op) => getSafetyType(op) === "PotentiallyUnsafe",
    );
    const isUnsafe = suggestion.operations.some(
      (op) => getSafetyType(op) === "Unsafe",
    );

    const label = isSafe
      ? `Fix: ${issue.code}`
      : isPotentiallyUnsafe
        ? `Fix (potentially unsafe): ${issue.code}`
        : `Fix (unsafe): ${issue.code}`;

    const kind = isSafe
      ? vscode.CodeActionKind.QuickFix
      : vscode.CodeActionKind.QuickFix.append("unsafe");

    const action = new vscode.CodeAction(label, kind);
    action.diagnostics = [diagnostic];
    action.isPreferred = isSafe;

    const edit = new vscode.WorkspaceEdit();
    for (const op of suggestion.operations) {
      applyOperation(edit, document, op);
    }
    action.edit = edit;

    if (isUnsafe) {
      action.command = {
        command: "",
        title: "",
      };
    }

    actions.push(action);
  }

  return actions;
}

function getSafetyType(op: MagoSuggestionOperation): string {
  switch (op.type) {
    case "Insert":
      return op.value.safety_classification.type;
    case "Replace":
      return op.value.safety_classification.type;
    case "Delete":
      return op.value.safety_classification.type;
  }
}

function applyOperation(
  edit: vscode.WorkspaceEdit,
  document: vscode.TextDocument,
  op: MagoSuggestionOperation,
): void {
  switch (op.type) {
    case "Insert": {
      const pos = document.positionAt(op.value.offset);
      edit.insert(document.uri, pos, op.value.text);
      break;
    }
    case "Replace": {
      const start = document.positionAt(op.value.range.start);
      const end = document.positionAt(op.value.range.end);
      edit.replace(document.uri, new vscode.Range(start, end), op.value.text);
      break;
    }
    case "Delete": {
      const start = document.positionAt(op.value.range.start);
      const end = document.positionAt(op.value.range.end);
      edit.delete(document.uri, new vscode.Range(start, end));
      break;
    }
  }
}

export function register(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      PHP_SELECTOR,
      createCodeActionProvider(),
      {
        providedCodeActionKinds: [
          vscode.CodeActionKind.QuickFix,
          vscode.CodeActionKind.SourceFixAll.append("mago"),
        ],
      },
    ),
  );
}
