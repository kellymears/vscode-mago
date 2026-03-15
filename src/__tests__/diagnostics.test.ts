import { describe, it, expect, vi, beforeEach } from "vitest";
import { DiagnosticSeverity } from "../__mocks__/vscode";
import { createMockDocument, createTestIssue } from "./helpers";

vi.mock("../mago", () => ({
  lint: vi.fn(),
  lintWorkspace: vi.fn(),
  analyze: vi.fn(),
  analyzeWorkspace: vi.fn(),
}));

// Must import after mock setup
import * as mago from "../mago";
import * as diagnostics from "../diagnostics";
import * as vscode from "vscode";

const mockDoc = createMockDocument("<?php\necho 'hello';\necho 'world';\n");

describe("diagnostics", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    diagnostics.dispose();
  });

  describe("runLint", () => {
    it("creates diagnostics from lint issues", async () => {
      vi.mocked(mago.lint).mockResolvedValue([createTestIssue()]);

      await diagnostics.runLint(mockDoc as any, "/bin/mago", "/workspace");

      // Verify the diagnostic collection received diagnostics
      const collection = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[0]!.value;
      expect(collection.set).toHaveBeenCalledWith(
        mockDoc.uri,
        expect.arrayContaining([
          expect.objectContaining({
            source: "mago",
            code: "strict-types",
          }),
        ]),
      );
    });

    it("maps Error level to DiagnosticSeverity.Error", async () => {
      vi.mocked(mago.lint).mockResolvedValue([
        createTestIssue({ level: "Error" }),
      ]);

      await diagnostics.runLint(mockDoc as any, "/bin/mago", "/workspace");

      const collection = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[0]!.value;
      const args = collection.set.mock.calls[0]!;
      const diags = args[1] as any[];
      expect(diags[0].severity).toBe(DiagnosticSeverity.Error);
    });

    it("maps Warning level to DiagnosticSeverity.Warning", async () => {
      vi.mocked(mago.lint).mockResolvedValue([
        createTestIssue({ level: "Warning" }),
      ]);

      await diagnostics.runLint(mockDoc as any, "/bin/mago", "/workspace");

      const collection = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[0]!.value;
      const diags = collection.set.mock.calls[0]![1] as any[];
      expect(diags[0].severity).toBe(DiagnosticSeverity.Warning);
    });

    it("maps Note level to DiagnosticSeverity.Information", async () => {
      vi.mocked(mago.lint).mockResolvedValue([
        createTestIssue({ level: "Note" }),
      ]);

      await diagnostics.runLint(mockDoc as any, "/bin/mago", "/workspace");

      const collection = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[0]!.value;
      const diags = collection.set.mock.calls[0]![1] as any[];
      expect(diags[0].severity).toBe(DiagnosticSeverity.Information);
    });

    it("maps Help level to DiagnosticSeverity.Hint", async () => {
      vi.mocked(mago.lint).mockResolvedValue([
        createTestIssue({ level: "Help" }),
      ]);

      await diagnostics.runLint(mockDoc as any, "/bin/mago", "/workspace");

      const collection = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[0]!.value;
      const diags = collection.set.mock.calls[0]![1] as any[];
      expect(diags[0].severity).toBe(DiagnosticSeverity.Hint);
    });

    it("appends help text to the diagnostic message", async () => {
      vi.mocked(mago.lint).mockResolvedValue([
        createTestIssue({
          message: "Main message.",
          help: "Helpful suggestion.",
        }),
      ]);

      await diagnostics.runLint(mockDoc as any, "/bin/mago", "/workspace");

      const collection = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[0]!.value;
      const diags = collection.set.mock.calls[0]![1] as any[];
      expect(diags[0].message).toContain("Main message.");
      expect(diags[0].message).toContain("Helpful suggestion.");
    });

    it("includes relatedInformation from secondary annotations", async () => {
      vi.mocked(mago.lint).mockResolvedValue([
        createTestIssue({
          annotations: [
            {
              kind: "Primary",
              span: {
                file_id: {
                  name: "test.php",
                  path: "/workspace/test.php",
                  size: 50,
                  file_type: "Host",
                },
                start: { offset: 0, line: 0 },
                end: { offset: 10, line: 0 },
              },
            },
            {
              message: "Related location",
              kind: "Secondary",
              span: {
                file_id: {
                  name: "test.php",
                  path: "/workspace/test.php",
                  size: 50,
                  file_type: "Host",
                },
                start: { offset: 20, line: 1 },
                end: { offset: 30, line: 1 },
              },
            },
          ],
        }),
      ]);

      await diagnostics.runLint(mockDoc as any, "/bin/mago", "/workspace");

      const collection = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[0]!.value;
      const diags = collection.set.mock.calls[0]![1] as any[];
      expect(diags[0].relatedInformation).toHaveLength(1);
      expect(diags[0].relatedInformation[0].message).toBe("Related location");
    });

    it("sets tags when issue has suggestions", async () => {
      const fixableIssue = createTestIssue({
        suggestions: [
          [
            {
              name: "test.php",
              path: "/workspace/test.php",
              size: 50,
              file_type: "Host",
            },
            {
              operations: [
                {
                  type: "Replace",
                  value: {
                    range: { start: 0, end: 5 },
                    text: "new",
                    safety_classification: { type: "Safe" },
                  },
                },
              ],
            },
          ],
        ],
      });
      vi.mocked(mago.lint).mockResolvedValue([fixableIssue]);

      await diagnostics.runLint(mockDoc as any, "/bin/mago", "/workspace");

      const collection = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[0]!.value;
      const diags = collection.set.mock.calls[0]![1] as any[];
      expect(diags[0].tags).toEqual([]);
    });

    it("skips issues without a primary annotation", async () => {
      vi.mocked(mago.lint).mockResolvedValue([
        createTestIssue({ annotations: [] }),
      ]);

      await diagnostics.runLint(mockDoc as any, "/bin/mago", "/workspace");

      const collection = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[0]!.value;
      const diags = collection.set.mock.calls[0]![1] as any[];
      expect(diags).toHaveLength(0);
    });

    it("passes configPath and phpVersion to mago.lint", async () => {
      vi.mocked(mago.lint).mockResolvedValue([]);

      await diagnostics.runLint(
        mockDoc as any,
        "/bin/mago",
        "/workspace",
        "/custom.toml",
        "8.2",
      );

      expect(mago.lint).toHaveBeenCalledWith(
        "/bin/mago",
        "/workspace",
        mockDoc.uri.fsPath,
        "/custom.toml",
        "8.2",
      );
    });
  });

  describe("runAnalyze", () => {
    it("uses a separate diagnostic collection from lint", async () => {
      vi.mocked(mago.lint).mockResolvedValue([createTestIssue()]);
      vi.mocked(mago.analyze).mockResolvedValue([
        createTestIssue({ code: "analysis-rule" }),
      ]);

      await diagnostics.runLint(mockDoc as any, "/bin/mago", "/workspace");
      await diagnostics.runAnalyze(mockDoc as any, "/bin/mago", "/workspace");

      // Should have created two separate collections
      expect(vscode.languages.createDiagnosticCollection).toHaveBeenCalledWith(
        "mago-lint",
      );
      expect(vscode.languages.createDiagnosticCollection).toHaveBeenCalledWith(
        "mago-analyze",
      );
    });
  });

  describe("getIssueForDiagnostic", () => {
    it("returns the original issue for a diagnostic", async () => {
      const issue = createTestIssue();
      vi.mocked(mago.lint).mockResolvedValue([issue]);

      await diagnostics.runLint(mockDoc as any, "/bin/mago", "/workspace");

      const collection = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[0]!.value;
      const diags = collection.set.mock.calls[0]![1] as any[];
      const retrieved = diagnostics.getIssueForDiagnostic(diags[0]);

      expect(retrieved).toBe(issue);
    });
  });

  describe("clearFile", () => {
    it("deletes diagnostics for a given URI from both collections", async () => {
      vi.mocked(mago.lint).mockResolvedValue([]);
      vi.mocked(mago.analyze).mockResolvedValue([]);

      // Initialize both collections
      await diagnostics.runLint(mockDoc as any, "/bin/mago", "/workspace");
      await diagnostics.runAnalyze(mockDoc as any, "/bin/mago", "/workspace");

      diagnostics.clearFile(mockDoc.uri as any);

      const lintCol = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[0]!.value;
      const analyzeCol = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[1]!.value;

      expect(lintCol.delete).toHaveBeenCalledWith(mockDoc.uri);
      expect(analyzeCol.delete).toHaveBeenCalledWith(mockDoc.uri);
    });
  });

  describe("clearAll", () => {
    it("clears both diagnostic collections", async () => {
      vi.mocked(mago.lint).mockResolvedValue([]);
      vi.mocked(mago.analyze).mockResolvedValue([]);

      await diagnostics.runLint(mockDoc as any, "/bin/mago", "/workspace");
      await diagnostics.runAnalyze(mockDoc as any, "/bin/mago", "/workspace");

      diagnostics.clearAll();

      const lintCol = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[0]!.value;
      const analyzeCol = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[1]!.value;

      expect(lintCol.clear).toHaveBeenCalled();
      expect(analyzeCol.clear).toHaveBeenCalled();
    });
  });

  describe("runLintWorkspace", () => {
    it("calls mago.lintWorkspace and sets diagnostics per file", async () => {
      const issue = createTestIssue();
      vi.mocked(mago.lintWorkspace).mockResolvedValue([issue]);
      vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(
        mockDoc as any,
      );

      await diagnostics.runLintWorkspace("/bin/mago", "/workspace");

      expect(mago.lintWorkspace).toHaveBeenCalledWith(
        "/bin/mago",
        "/workspace",
        undefined,
        undefined,
      );

      // openTextDocument is called to map offsets → positions
      expect(vscode.workspace.openTextDocument).toHaveBeenCalled();

      // Wait for the async openTextDocument → setDiagnosticsFromIssues chain
      await new Promise((r) => setTimeout(r, 10));

      const collection = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[0]!.value;
      expect(collection.set).toHaveBeenCalled();
    });

    it("clears previous diagnostics before setting new ones", async () => {
      vi.mocked(mago.lintWorkspace).mockResolvedValue([]);

      await diagnostics.runLintWorkspace("/bin/mago", "/workspace");

      const collection = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[0]!.value;
      expect(collection.clear).toHaveBeenCalled();
    });

    it("passes configPath and phpVersion", async () => {
      vi.mocked(mago.lintWorkspace).mockResolvedValue([]);

      await diagnostics.runLintWorkspace(
        "/bin/mago",
        "/workspace",
        "/c.toml",
        "8.1",
      );

      expect(mago.lintWorkspace).toHaveBeenCalledWith(
        "/bin/mago",
        "/workspace",
        "/c.toml",
        "8.1",
      );
    });

    it("handles openTextDocument failure gracefully", async () => {
      const issue = createTestIssue();
      vi.mocked(mago.lintWorkspace).mockResolvedValue([issue]);
      vi.mocked(vscode.workspace.openTextDocument).mockRejectedValue(
        new Error("file not found"),
      );

      // Should not throw
      await diagnostics.runLintWorkspace("/bin/mago", "/workspace");
      await new Promise((r) => setTimeout(r, 10));
    });
  });

  describe("runAnalyzeWorkspace", () => {
    it("calls mago.analyzeWorkspace and sets diagnostics", async () => {
      const issue = createTestIssue({ code: "analysis-issue" });
      vi.mocked(mago.analyzeWorkspace).mockResolvedValue([issue]);
      vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(
        mockDoc as any,
      );

      // Initialize lint collection first so analyze gets a separate one
      vi.mocked(mago.lint).mockResolvedValue([]);
      await diagnostics.runLint(mockDoc as any, "/bin/mago", "/workspace");

      await diagnostics.runAnalyzeWorkspace("/bin/mago", "/workspace");
      await new Promise((r) => setTimeout(r, 10));

      expect(mago.analyzeWorkspace).toHaveBeenCalled();
      // The analyze collection (second created) should have been used
      const analyzeCol = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[1]!.value;
      expect(analyzeCol.clear).toHaveBeenCalled();
    });
  });

  describe("dispose", () => {
    it("disposes both collections", async () => {
      vi.mocked(mago.lint).mockResolvedValue([]);
      vi.mocked(mago.analyze).mockResolvedValue([]);

      await diagnostics.runLint(mockDoc as any, "/bin/mago", "/workspace");
      await diagnostics.runAnalyze(mockDoc as any, "/bin/mago", "/workspace");

      const lintCol = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[0]!.value;
      const analyzeCol = vi.mocked(vscode.languages.createDiagnosticCollection)
        .mock.results[1]!.value;

      diagnostics.dispose();

      expect(lintCol.dispose).toHaveBeenCalled();
      expect(analyzeCol.dispose).toHaveBeenCalled();
    });
  });
});
