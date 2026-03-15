import * as vscode from "vscode";
import type { MagoAnnotation, MagoIssue } from "./types.js";
import * as mago from "./mago.js";
import * as logger from "./logger.js";

// Separate collections for lint vs analyze
let lintCollection: vscode.DiagnosticCollection | undefined;
let analyzeCollection: vscode.DiagnosticCollection | undefined;

// Map diagnostics to their original mago issues for code actions
const issueMap = new WeakMap<vscode.Diagnostic, MagoIssue>();

export function getIssueForDiagnostic(
  diagnostic: vscode.Diagnostic,
): MagoIssue | undefined {
  return issueMap.get(diagnostic);
}

function getLintCollection(): vscode.DiagnosticCollection {
  if (!lintCollection) {
    lintCollection = vscode.languages.createDiagnosticCollection("mago-lint");
  }
  return lintCollection;
}

function getAnalyzeCollection(): vscode.DiagnosticCollection {
  if (!analyzeCollection) {
    analyzeCollection =
      vscode.languages.createDiagnosticCollection("mago-analyze");
  }
  return analyzeCollection;
}

function mapSeverity(level: MagoIssue["level"]): vscode.DiagnosticSeverity {
  switch (level) {
    case "Error":
      return vscode.DiagnosticSeverity.Error;
    case "Warning":
      return vscode.DiagnosticSeverity.Warning;
    case "Note":
      return vscode.DiagnosticSeverity.Information;
    case "Help":
      return vscode.DiagnosticSeverity.Hint;
  }
}

function getPrimaryAnnotation(
  issue: MagoIssue,
): MagoAnnotation | undefined {
  return issue.annotations.find((a) => a.kind === "Primary");
}

function issueToDiagnostic(
  issue: MagoIssue,
  document: vscode.TextDocument,
): vscode.Diagnostic | undefined {
  const primary = getPrimaryAnnotation(issue);
  if (!primary) return undefined;

  const start = document.positionAt(primary.span.start.offset);
  const end = document.positionAt(primary.span.end.offset);
  const range = new vscode.Range(start, end);

  const diagnostic = new vscode.Diagnostic(
    range,
    issue.message,
    mapSeverity(issue.level),
  );

  diagnostic.source = "mago";
  diagnostic.code = issue.code;

  if (issue.help) {
    diagnostic.message += `\n${issue.help}`;
  }

  // Related info from secondary annotations
  const secondaries = issue.annotations.filter((a) => a.kind === "Secondary");
  if (secondaries.length > 0) {
    diagnostic.relatedInformation = secondaries
      .filter((a) => a.message)
      .map(
        (a) =>
          new vscode.DiagnosticRelatedInformation(
            new vscode.Location(
              document.uri,
              new vscode.Range(
                document.positionAt(a.span.start.offset),
                document.positionAt(a.span.end.offset),
              ),
            ),
            a.message ?? "",
          ),
      );
  }

  // Tag for suggestions availability
  if (issue.suggestions && issue.suggestions.length > 0) {
    diagnostic.tags = [];
  }

  issueMap.set(diagnostic, issue);

  return diagnostic;
}

function setDiagnosticsFromIssues(
  collection: vscode.DiagnosticCollection,
  document: vscode.TextDocument,
  issues: readonly MagoIssue[],
): void {
  const diagnostics: vscode.Diagnostic[] = [];

  for (const issue of issues) {
    const diagnostic = issueToDiagnostic(issue, document);
    if (diagnostic) diagnostics.push(diagnostic);
  }

  collection.set(document.uri, diagnostics);
}

function setWorkspaceDiagnosticsFromIssues(
  collection: vscode.DiagnosticCollection,
  issues: readonly MagoIssue[],
): void {
  // Group issues by file path
  const byFile = new Map<string, MagoIssue[]>();
  for (const issue of issues) {
    const primary = getPrimaryAnnotation(issue);
    if (!primary) continue;
    const filePath = primary.span.file_id.path;
    const existing = byFile.get(filePath);
    if (existing) {
      existing.push(issue);
    } else {
      byFile.set(filePath, [issue]);
    }
  }

  // Clear old diagnostics
  collection.clear();

  // Set diagnostics per file
  for (const [filePath, fileIssues] of byFile) {
    const uri = vscode.Uri.file(filePath);
    // We need a document to resolve offsets to positions.
    // Use a deferred approach: open the document just for position mapping.
    void vscode.workspace.openTextDocument(uri).then(
      (doc) => {
        setDiagnosticsFromIssues(collection, doc, fileIssues);
      },
      (err) => {
        logger.warn(
          `Could not open ${filePath} for diagnostics: ${err instanceof Error ? err.message : String(err)}`,
        );
      },
    );
  }
}

// --- Public API ---

export async function runLint(
  document: vscode.TextDocument,
  binaryPath: string,
  cwd: string,
  configPath?: string,
  phpVersion?: string,
): Promise<void> {
  const issues = await mago.lint(
    binaryPath,
    cwd,
    document.uri.fsPath,
    configPath,
    phpVersion,
  );
  setDiagnosticsFromIssues(getLintCollection(), document, issues);
}

export async function runLintWorkspace(
  binaryPath: string,
  cwd: string,
  configPath?: string,
  phpVersion?: string,
): Promise<void> {
  const issues = await mago.lintWorkspace(binaryPath, cwd, configPath, phpVersion);
  setWorkspaceDiagnosticsFromIssues(getLintCollection(), issues);
}

export async function runAnalyze(
  document: vscode.TextDocument,
  binaryPath: string,
  cwd: string,
  configPath?: string,
  phpVersion?: string,
): Promise<void> {
  const issues = await mago.analyze(
    binaryPath,
    cwd,
    document.uri.fsPath,
    configPath,
    phpVersion,
  );
  setDiagnosticsFromIssues(getAnalyzeCollection(), document, issues);
}

export async function runAnalyzeWorkspace(
  binaryPath: string,
  cwd: string,
  configPath?: string,
  phpVersion?: string,
): Promise<void> {
  const issues = await mago.analyzeWorkspace(
    binaryPath,
    cwd,
    configPath,
    phpVersion,
  );
  setWorkspaceDiagnosticsFromIssues(getAnalyzeCollection(), issues);
}

export function clearFile(uri: vscode.Uri): void {
  lintCollection?.delete(uri);
  analyzeCollection?.delete(uri);
}

export function clearLint(): void {
  lintCollection?.clear();
}

export function clearAll(): void {
  lintCollection?.clear();
  analyzeCollection?.clear();
}

export function dispose(): void {
  lintCollection?.dispose();
  analyzeCollection?.dispose();
  lintCollection = undefined;
  analyzeCollection = undefined;
}
