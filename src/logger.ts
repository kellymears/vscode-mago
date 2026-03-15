import * as vscode from "vscode";
import { LogLevel } from "./types.js";

let channel: vscode.OutputChannel | undefined;
let currentLevel = LogLevel.Off;

function getChannel(): vscode.OutputChannel {
  if (!channel) {
    channel = vscode.window.createOutputChannel("Mago");
  }
  return channel;
}

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

export function parseLogLevel(value: string): LogLevel {
  switch (value) {
    case "error":
      return LogLevel.Error;
    case "warn":
      return LogLevel.Warn;
    case "info":
      return LogLevel.Info;
    case "debug":
      return LogLevel.Debug;
    default:
      return LogLevel.Off;
  }
}

function log(level: LogLevel, prefix: string, message: string): void {
  if (level > currentLevel) return;
  getChannel().appendLine(`[${prefix}] ${message}`);
}

export function error(message: string): void {
  log(LogLevel.Error, "ERROR", message);
}

export function warn(message: string): void {
  log(LogLevel.Warn, "WARN", message);
}

export function info(message: string): void {
  log(LogLevel.Info, "INFO", message);
}

export function debug(message: string): void {
  log(LogLevel.Debug, "DEBUG", message);
}

export function show(): void {
  getChannel().show(true);
}

export function dispose(): void {
  channel?.dispose();
  channel = undefined;
}
