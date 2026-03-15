import { describe, it, expect, vi, beforeEach } from "vitest";
import * as vscode from "vscode";
import { MagoState } from "../types";
import * as statusBar from "../status-bar";

describe("status-bar", () => {
  let mockItem: ReturnType<typeof vscode.window.createStatusBarItem>;

  beforeEach(() => {
    vi.resetAllMocks();
    statusBar.dispose();
    mockItem = vscode.window.createStatusBarItem();
    vi.mocked(vscode.window.createStatusBarItem).mockReturnValue(mockItem);
  });

  describe("setState", () => {
    it("shows version in Ready state", () => {
      statusBar.setState(MagoState.Ready, "1.0.0");
      expect(mockItem.text).toBe("Mago v1.0.0");
    });

    it("shows plain name in Ready state without version", () => {
      statusBar.setState(MagoState.Ready);
      expect(mockItem.text).toBe("Mago");
    });

    it("shows spinner in Running state", () => {
      statusBar.setState(MagoState.Running);
      expect(mockItem.text).toContain("sync~spin");
    });

    it("shows error indicator in Error state", () => {
      statusBar.setState(MagoState.Error);
      expect(mockItem.text).toContain("error");
    });

    it("shows disabled indicator in Disabled state", () => {
      statusBar.setState(MagoState.Disabled);
      expect(mockItem.text).toContain("circle-slash");
    });
  });

  describe("show/hide", () => {
    it("shows the status bar item", () => {
      statusBar.show();
      expect(mockItem.show).toHaveBeenCalled();
    });

    it("hides the status bar item", () => {
      statusBar.hide();
      expect(mockItem.hide).toHaveBeenCalled();
    });
  });

  describe("updateVisibility", () => {
    it("shows when active editor is PHP", () => {
      (vscode.window as any).activeTextEditor = {
        document: { languageId: "php" },
      };

      statusBar.updateVisibility();
      expect(mockItem.show).toHaveBeenCalled();
    });

    it("hides when active editor is not PHP", () => {
      (vscode.window as any).activeTextEditor = {
        document: { languageId: "javascript" },
      };

      statusBar.updateVisibility();
      expect(mockItem.hide).toHaveBeenCalled();
    });

    it("hides when no active editor", () => {
      (vscode.window as any).activeTextEditor = undefined;

      statusBar.updateVisibility();
      expect(mockItem.hide).toHaveBeenCalled();
    });
  });
});
