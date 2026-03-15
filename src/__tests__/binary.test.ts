import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs/promises", () => ({
  access: vi.fn(),
  constants: { X_OK: 1 },
}));

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

import { access } from "node:fs/promises";
import { execFile } from "node:child_process";
import { resolveBinary, getVersion } from "../binary";

describe("binary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("resolveBinary", () => {
    it("returns the setting path when it is executable", async () => {
      vi.mocked(access).mockResolvedValueOnce(undefined);

      const result = await resolveBinary("/workspace", "/custom/mago");
      expect(result).toBe("/custom/mago");
    });

    it("falls through when setting path is not executable", async () => {
      // Setting path check fails
      vi.mocked(access).mockRejectedValueOnce(new Error("ENOENT"));
      // vendor/bin/mago fails
      vi.mocked(access).mockRejectedValueOnce(new Error("ENOENT"));
      // ./mago fails
      vi.mocked(access).mockRejectedValueOnce(new Error("ENOENT"));
      // which fails
      vi.mocked(execFile).mockImplementation(
        (_cmd: any, _args: any, cb: any) => {
          cb(new Error("not found"), "", "");
          return {} as any;
        },
      );

      const result = await resolveBinary("/workspace", "/bad/path");
      expect(result).toBeUndefined();
    });

    it("finds vendor/bin/mago when no setting is given", async () => {
      // vendor/bin/mago succeeds
      vi.mocked(access).mockResolvedValueOnce(undefined);

      const result = await resolveBinary("/workspace", "");
      expect(result).toBe("/workspace/vendor/bin/mago");
    });

    it("finds ./mago when vendor/bin/mago is missing", async () => {
      // vendor/bin/mago fails
      vi.mocked(access).mockRejectedValueOnce(new Error("ENOENT"));
      // ./mago succeeds
      vi.mocked(access).mockResolvedValueOnce(undefined);

      const result = await resolveBinary("/workspace", "");
      expect(result).toBe("/workspace/mago");
    });

    it("falls back to PATH when local candidates are missing", async () => {
      // vendor/bin/mago fails
      vi.mocked(access).mockRejectedValueOnce(new Error("ENOENT"));
      // ./mago fails
      vi.mocked(access).mockRejectedValueOnce(new Error("ENOENT"));
      // which succeeds
      vi.mocked(execFile).mockImplementation(
        (_cmd: any, _args: any, cb: any) => {
          cb(null, "/usr/local/bin/mago\n", "");
          return {} as any;
        },
      );

      const result = await resolveBinary("/workspace", "");
      expect(result).toBe("/usr/local/bin/mago");
    });

    it("returns undefined when which() stdout trims to empty string", async () => {
      // vendor/bin/mago fails
      vi.mocked(access).mockRejectedValueOnce(new Error("ENOENT"));
      // ./mago fails
      vi.mocked(access).mockRejectedValueOnce(new Error("ENOENT"));
      // which returns whitespace-only stdout
      vi.mocked(execFile).mockImplementation(
        (_cmd: any, _args: any, cb: any) => {
          cb(null, "   \n", "");
          return {} as any;
        },
      );

      const result = await resolveBinary("/workspace", "");
      expect(result).toBeUndefined();
    });

    it("returns undefined when nothing is found", async () => {
      vi.mocked(access).mockRejectedValue(new Error("ENOENT"));
      vi.mocked(execFile).mockImplementation(
        (_cmd: any, _args: any, cb: any) => {
          cb(new Error("not found"), "", "");
          return {} as any;
        },
      );

      const result = await resolveBinary("/workspace", "");
      expect(result).toBeUndefined();
    });
  });

  describe("getVersion", () => {
    it("parses version from mago --version output", async () => {
      vi.mocked(execFile).mockImplementation(
        (_cmd: any, _args: any, _opts: any, cb: any) => {
          cb(null, "mago 1.0.0-beta.27\n", "");
          return {} as any;
        },
      );

      const version = await getVersion("/usr/local/bin/mago");
      expect(version).toBe("1.0.0-beta.27");
    });

    it("rejects when execFile fails", async () => {
      vi.mocked(execFile).mockImplementation(
        (_cmd: any, _args: any, _opts: any, cb: any) => {
          cb(new Error("ENOENT"), "", "");
          return {} as any;
        },
      );

      await expect(getVersion("/bad/path")).rejects.toThrow(
        "Failed to get mago version",
      );
    });
  });

  describe("showBinaryMissingError", () => {
    it("shows an error notification", async () => {
      const { showBinaryMissingError } = await import("../binary");
      const vscode = await import("vscode");

      vi.mocked(vscode.window.showErrorMessage).mockResolvedValue(
        undefined as any,
      );
      showBinaryMissingError();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        "Mago binary not found. Install mago or set the path in settings.",
        "Open Settings",
      );
    });

    it("opens settings when user clicks 'Open Settings'", async () => {
      const { showBinaryMissingError } = await import("../binary");
      const vscode = await import("vscode");

      vi.mocked(vscode.window.showErrorMessage).mockResolvedValue(
        "Open Settings" as any,
      );
      showBinaryMissingError();

      // Flush the promise chain
      await new Promise((r) => setTimeout(r, 0));

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        "workbench.action.openSettings",
        "mago.bin",
      );
    });
  });
});
