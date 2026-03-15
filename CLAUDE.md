# vscode-mago

VS Code extension for the [mago](https://github.com/carthage-software/mago) PHP toolchain — formatting, linting, static analysis, and code actions.

## Architecture

TypeScript + esbuild → single bundled `dist/extension.js`. No runtime npm dependencies.

### Source layout

```
src/
  extension.ts       – Activation, command registration, event wiring, disposal
  mago.ts            – Async CLI wrapper (execFile), JSON output parsing
  binary.ts          – Binary discovery: setting → vendor/bin/mago → ./mago → PATH
  config.ts          – Settings reader + mago.toml FileSystemWatcher
  formatter.ts       – DocumentFormattingEditProvider (stdin pipe)
  diagnostics.ts     – DiagnosticCollections for lint + analyze, severity mapping
  code-actions.ts    – Quick fixes from mago suggestions, source.fixAll.mago
  status-bar.ts      – StatusBarItem states: Ready / Running / Error / Disabled
  logger.ts          – OutputChannel wrapper with configurable log levels
  types.ts           – Shared interfaces for CLI JSON output + extension state
```

### Pipeline

1. **Activation** — `onLanguage:php` resolves binary, validates version, shows status bar
2. **Format** — `mago format --stdin-input` via async execFile, full-document replace
3. **Lint/Analyze** — `mago lint|analyze --reporting-format json [file]` on save (or on-type with debounce)
4. **Code actions** — Maps mago suggestion operations (Insert/Replace/Delete) to WorkspaceEdits
5. **Config** — FileSystemWatcher on `**/mago.toml`, debounced re-run of diagnostics

### External dependency

The `mago` binary is resolved via configurable discovery chain. Extension no-ops gracefully with an error notification if binary is missing.

## Development

```sh
npm install
npm run build          # esbuild bundle
npm run typecheck      # tsc --noEmit
npm run package        # build + vsce package
npm run watch          # esbuild watch mode
```

## Key files

- `src/extension.ts` — entry point, all wiring
- `package.json` — VS Code manifest (settings, commands, activation)
- `esbuild.config.mjs` — bundler config
- `tsconfig.json` — strict TypeScript config
