import * as vscode from "vscode";
import { MagoState } from "./types.js";

let item: vscode.StatusBarItem | undefined;

function getItem(): vscode.StatusBarItem {
  if (!item) {
    item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100,
    );
    item.command = "mago.showOutput";
  }
  return item;
}

export function setState(state: MagoState, version?: string): void {
  const bar = getItem();

  switch (state) {
    case MagoState.Ready:
      bar.text = version ? `Mago v${version}` : "Mago";
      bar.tooltip = "Mago — ready";
      bar.backgroundColor = undefined;
      break;
    case MagoState.Running:
      bar.text = "$(sync~spin) Mago";
      bar.tooltip = "Mago — running...";
      bar.backgroundColor = undefined;
      break;
    case MagoState.Error:
      bar.text = "$(error) Mago";
      bar.tooltip = "Mago — error (click to view output)";
      bar.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.errorBackground",
      );
      break;
    case MagoState.Disabled:
      bar.text = "$(circle-slash) Mago";
      bar.tooltip = "Mago — disabled";
      bar.backgroundColor = undefined;
      break;
  }
}

export function show(): void {
  getItem().show();
}

export function hide(): void {
  getItem().hide();
}

/** Show/hide based on active editor language. */
export function updateVisibility(): void {
  const editor = vscode.window.activeTextEditor;
  if (editor?.document.languageId === "php") {
    show();
  } else {
    hide();
  }
}

export function dispose(): void {
  item?.dispose();
  item = undefined;
}
