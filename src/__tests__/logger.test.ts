import { describe, it, expect, vi, beforeEach } from "vitest";
import { LogLevel } from "../types";
import * as vscode from "vscode";
import * as logger from "../logger";

describe("logger", () => {
  describe("parseLogLevel", () => {
    it("maps 'error' to LogLevel.Error", () => {
      expect(logger.parseLogLevel("error")).toBe(LogLevel.Error);
    });

    it("maps 'warn' to LogLevel.Warn", () => {
      expect(logger.parseLogLevel("warn")).toBe(LogLevel.Warn);
    });

    it("maps 'info' to LogLevel.Info", () => {
      expect(logger.parseLogLevel("info")).toBe(LogLevel.Info);
    });

    it("maps 'debug' to LogLevel.Debug", () => {
      expect(logger.parseLogLevel("debug")).toBe(LogLevel.Debug);
    });

    it("maps 'off' to LogLevel.Off", () => {
      expect(logger.parseLogLevel("off")).toBe(LogLevel.Off);
    });

    it("maps unknown string to LogLevel.Off", () => {
      expect(logger.parseLogLevel("garbage")).toBe(LogLevel.Off);
    });
  });

  describe("log level gating", () => {
    let appendLine: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      logger.dispose();
      appendLine = vi.fn();
      vi.mocked(vscode.window.createOutputChannel).mockReturnValue({
        appendLine,
        append: vi.fn(),
        clear: vi.fn(),
        show: vi.fn(),
        hide: vi.fn(),
        dispose: vi.fn(),
      } as any);
    });

    it("suppresses messages below the configured level", () => {
      logger.setLogLevel(LogLevel.Error);
      logger.debug("should not appear");
      logger.info("should not appear");
      logger.warn("should not appear");
      expect(appendLine).not.toHaveBeenCalled();
    });

    it("emits messages at or above the configured level", () => {
      logger.setLogLevel(LogLevel.Warn);
      logger.error("an error");
      logger.warn("a warning");
      expect(appendLine).toHaveBeenCalledTimes(2);
    });

    it("emits all messages at debug level", () => {
      logger.setLogLevel(LogLevel.Debug);
      logger.error("e");
      logger.warn("w");
      logger.info("i");
      logger.debug("d");
      expect(appendLine).toHaveBeenCalledTimes(4);
    });

    it("emits nothing when level is Off", () => {
      logger.setLogLevel(LogLevel.Off);
      logger.error("should not appear");
      expect(appendLine).not.toHaveBeenCalled();
    });
  });

  describe("show", () => {
    it("calls show on the output channel", () => {
      const mockShow = vi.fn();
      vi.mocked(vscode.window.createOutputChannel).mockReturnValue({
        appendLine: vi.fn(),
        append: vi.fn(),
        clear: vi.fn(),
        show: mockShow,
        hide: vi.fn(),
        dispose: vi.fn(),
      } as any);

      logger.dispose();
      logger.show();
      expect(mockShow).toHaveBeenCalledWith(true);
    });
  });
});
