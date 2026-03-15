# Mago for VS Code

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/kellymears.vscode-mago)](https://marketplace.visualstudio.com/items?itemName=kellymears.vscode-mago) [![License](https://img.shields.io/github/license/kellymears/vscode-mago-formatter)](LICENSE) [![VS Code](https://img.shields.io/badge/vscode-%5E1.75.0-blue)](https://code.visualstudio.com/)

VS Code extension for the [mago](https://github.com/carthage-software/mago) PHP toolchain — formatting, linting, and static analysis.

## Features

- **Format** — Format PHP files using `mago format` (format-on-save compatible)
- **Lint** — Real-time diagnostics from 135+ lint rules across 9 categories
- **Analyze** — Static analysis diagnostics in the Problems panel
- **Code actions** — Quick fixes and batch fix-all from mago suggestions
- **Explain rule** — View documentation for any lint rule from the command palette

## Requirements

Install the [mago CLI](https://github.com/carthage-software/mago). The extension searches for the binary in this order:

1. `mago.bin` setting (explicit path)
2. `./vendor/bin/mago` (Composer local)
3. `./mago` (workspace root)
4. System `$PATH`

## Settings

| Setting                | Default    | Description                                         |
| ---------------------- | ---------- | --------------------------------------------------- |
| `mago.enabled`         | `true`     | Master enable/disable                               |
| `mago.bin`             | `""`       | Custom binary path                                  |
| `mago.configPath`      | `""`       | Custom `mago.toml` path                             |
| `mago.phpVersion`      | `""`       | Override PHP version                                |
| `mago.lint.enabled`    | `false`    | Enable lint diagnostics                             |
| `mago.lint.run`        | `"onSave"` | `"onSave"` or `"onType"`                            |
| `mago.analyze.enabled` | `false`    | Enable analyzer diagnostics                         |
| `mago.format.enabled`  | `true`     | Register as formatter                               |
| `mago.trace.level`     | `"info"`   | Log verbosity (`off`/`error`/`warn`/`info`/`debug`) |

## Commands

All commands are available via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **Mago: Format File** — Format the active PHP file
- **Mago: Lint File** — Lint the active file
- **Mago: Lint Workspace** — Lint all files in the workspace
- **Mago: Analyze File** — Run static analysis on the active file
- **Mago: Analyze Workspace** — Analyze all workspace files
- **Mago: Fix File (Safe)** — Apply safe auto-fixes
- **Mago: Fix File (All Including Unsafe)** — Apply all fixes (with confirmation)
- **Mago: Explain Rule** — Show documentation for a lint rule
- **Mago: Show Output** — Open the output channel
- **Mago: Restart** — Re-resolve binary and refresh diagnostics

## License

[MIT](LICENSE)
