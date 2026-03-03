const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vscode = require("vscode");

/**
 * Parse [source] excludes from mago.toml.
 * Returns an array of glob patterns.
 */
function loadExcludes(root) {
  try {
    const toml = readFileSync(join(root, "mago.toml"), "utf-8");
    const match = toml.match(/\[source\][\s\S]*?excludes\s*=\s*\[([\s\S]*?)\]/);
    if (!match) return [];
    return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  } catch {
    return [];
  }
}

/** Convert a simple glob pattern (with ** and *) to a RegExp. */
function globToRegex(glob) {
  const re = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "\0")
    .replace(/\*/g, "[^/]*")
    .replace(/\0/g, ".*");
  return new RegExp(`^${re}$`);
}

function activate(context) {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!root) return;

  const excludes = loadExcludes(root).map(globToRegex);

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider("php", {
      provideDocumentFormattingEdits(document) {
        const relative = vscode.workspace.asRelativePath(document.uri, false);
        if (excludes.some((re) => re.test(relative))) return [];

        const original = document.getText();
        try {
          const formatted = execFileSync(
            join(root, "mago"),
            ["format", "--stdin-input"],
            {
              input: original,
              encoding: "utf-8",
              cwd: root,
              maxBuffer: 10 * 1024 * 1024,
            },
          );
          if (formatted === original) return [];

          const range = new vscode.Range(
            document.positionAt(0),
            document.positionAt(original.length),
          );
          return [vscode.TextEdit.replace(range, formatted)];
        } catch {
          return [];
        }
      },
    }),
  );
}

module.exports = { activate };
