# Mago for VS Code

VS Code extension for the [mago](https://github.com/carthage-software/mago) PHP toolchain.

## Features

- **Format** — Format PHP files using `mago format` (format-on-save compatible)
- **Lint** — Real-time diagnostics from 135+ lint rules across 9 categories
- **Analyze** — Static analysis diagnostics in the Problems panel
- **Quick fixes** — Apply safe and unsafe fixes directly from the editor
- **Fix all** — Batch-apply all safe fixes via command or source action
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
| `mago.lint.enabled`    | `true`     | Enable lint diagnostics                             |
| `mago.lint.run`        | `"onSave"` | `"onSave"` or `"onType"`                            |
| `mago.analyze.enabled` | `true`     | Enable analyzer diagnostics                         |
| `mago.format.enabled`  | `true`     | Register as formatter                               |
| `mago.trace.level`     | `"off"`    | Log verbosity (`off`/`error`/`warn`/`info`/`debug`) |

## Commands

All commands are available via the Command Palette (`Cmd+Shift+P`):

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
