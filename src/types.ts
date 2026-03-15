import type * as vscode from "vscode";

// --- CLI JSON output types ---

export interface MagoFileId {
  readonly name: string;
  readonly path: string;
  readonly size: number;
  readonly file_type: string;
}

export interface MagoPosition {
  readonly offset: number;
  readonly line: number;
}

export interface MagoSpan {
  readonly file_id: MagoFileId;
  readonly start: MagoPosition;
  readonly end: MagoPosition;
}

export interface MagoAnnotation {
  readonly message?: string;
  readonly kind: "Primary" | "Secondary";
  readonly span: MagoSpan;
}

export interface MagoInsertOperation {
  readonly type: "Insert";
  readonly value: {
    readonly offset: number;
    readonly text: string;
    readonly safety_classification: MagoSafetyClassification;
  };
}

export interface MagoReplaceOperation {
  readonly type: "Replace";
  readonly value: {
    readonly range: { readonly start: number; readonly end: number };
    readonly text: string;
    readonly safety_classification: MagoSafetyClassification;
  };
}

export interface MagoDeleteOperation {
  readonly type: "Delete";
  readonly value: {
    readonly range: { readonly start: number; readonly end: number };
    readonly safety_classification: MagoSafetyClassification;
  };
}

export type MagoSuggestionOperation =
  | MagoInsertOperation
  | MagoReplaceOperation
  | MagoDeleteOperation;

export interface MagoSafetyClassification {
  readonly type: "Safe" | "PotentiallyUnsafe" | "Unsafe";
}

export type MagoSuggestion = readonly [
  MagoFileId,
  { readonly operations: readonly MagoSuggestionOperation[] },
];

export interface MagoIssue {
  readonly level: "Error" | "Warning" | "Note" | "Help";
  readonly code: string;
  readonly message: string;
  readonly notes: readonly string[];
  readonly help: string;
  readonly annotations: readonly MagoAnnotation[];
  readonly suggestions?: readonly MagoSuggestion[];
}

export interface MagoLintOutput {
  readonly issues: readonly MagoIssue[];
}

export interface MagoRuleInfo {
  readonly name: string;
  readonly code: string;
  readonly description: string;
  readonly good_example: string;
  readonly bad_example: string;
  readonly category: string;
  readonly requirements: {
    readonly "php-versions": readonly string[];
    readonly integrations: readonly string[];
  };
}

// --- Extension types ---

export interface CliResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
}

export const enum MagoState {
  Ready = "ready",
  Running = "running",
  Error = "error",
  Disabled = "disabled",
}

export const enum LogLevel {
  Off = 0,
  Error = 1,
  Warn = 2,
  Info = 3,
  Debug = 4,
}

export interface MagoSettings {
  readonly enabled: boolean;
  readonly bin: string;
  readonly configPath: string;
  readonly phpVersion: string;
  readonly lint: {
    readonly enabled: boolean;
    readonly run: "onSave" | "onType";
  };
  readonly analyze: { readonly enabled: boolean };
  readonly format: { readonly enabled: boolean };
  readonly trace: {
    readonly level: "off" | "error" | "warn" | "info" | "debug";
  };
}

export interface WorkspaceState {
  readonly folder: vscode.WorkspaceFolder;
  binaryPath: string | undefined;
  version: string | undefined;
}
