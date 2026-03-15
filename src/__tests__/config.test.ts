import { describe, it, expect, vi, beforeEach } from "vitest";
import * as vscode from "vscode";
import { getSettings, createConfigWatcher } from "../config";

describe("config", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getSettings", () => {
    it("returns defaults when no settings are configured", () => {
      const settings = getSettings();

      expect(settings.enabled).toBe(true);
      expect(settings.bin).toBe("");
      expect(settings.configPath).toBe("");
      expect(settings.phpVersion).toBe("");
      expect(settings.lint.enabled).toBe(true);
      expect(settings.lint.run).toBe("onSave");
      expect(settings.analyze.enabled).toBe(true);
      expect(settings.format.enabled).toBe(true);
      expect(settings.trace.level).toBe("info");
    });

    it("reads from vscode workspace configuration", () => {
      const mockGet = vi.fn((key: string, defaultValue?: unknown) => {
        const overrides: Record<string, unknown> = {
          enabled: false,
          bin: "/custom/mago",
          "lint.run": "onType",
          "trace.level": "debug",
        };
        return overrides[key] ?? defaultValue;
      });

      vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
        get: mockGet,
      } as any);

      const settings = getSettings();

      expect(settings.enabled).toBe(false);
      expect(settings.bin).toBe("/custom/mago");
      expect(settings.lint.run).toBe("onType");
      expect(settings.trace.level).toBe("debug");
    });
  });

  describe("createConfigWatcher", () => {
    it("creates a watcher for **/mago.toml", () => {
      const callback = vi.fn();
      createConfigWatcher(callback);

      expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalledWith(
        "**/mago.toml",
      );
    });

    it("returns a disposable watcher", () => {
      const watcher = createConfigWatcher(vi.fn());
      expect(watcher).toHaveProperty("dispose");
    });

    it("calls onChanged callback when mago.toml changes (debounced)", async () => {
      let changeHandler: (() => void) | undefined;
      let createHandler: (() => void) | undefined;
      let deleteHandler: (() => void) | undefined;

      vi.mocked(vscode.workspace.createFileSystemWatcher).mockReturnValue({
        onDidChange: vi.fn((cb) => {
          changeHandler = cb;
        }),
        onDidCreate: vi.fn((cb) => {
          createHandler = cb;
        }),
        onDidDelete: vi.fn((cb) => {
          deleteHandler = cb;
        }),
        dispose: vi.fn(),
      } as any);

      const callback = vi.fn();
      createConfigWatcher(callback);

      // Fire the change event
      changeHandler!();

      // Callback should not fire immediately (debounced)
      expect(callback).not.toHaveBeenCalled();

      // Wait for debounce (500ms in config.ts)
      await new Promise((r) => setTimeout(r, 600));

      expect(callback).toHaveBeenCalledOnce();
    });

    it("debounces rapid successive changes", async () => {
      let changeHandler: (() => void) | undefined;

      vi.mocked(vscode.workspace.createFileSystemWatcher).mockReturnValue({
        onDidChange: vi.fn((cb) => {
          changeHandler = cb;
        }),
        onDidCreate: vi.fn(),
        onDidDelete: vi.fn(),
        dispose: vi.fn(),
      } as any);

      const callback = vi.fn();
      createConfigWatcher(callback);

      // Fire multiple changes rapidly
      changeHandler!();
      changeHandler!();
      changeHandler!();

      await new Promise((r) => setTimeout(r, 600));

      // Should only have been called once despite 3 triggers
      expect(callback).toHaveBeenCalledOnce();
    });
  });
});
