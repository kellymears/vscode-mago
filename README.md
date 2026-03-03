# Mago Formatter

VS Code formatter for PHP files using [mago](https://github.com/carthage-software/mago). Respects `mago.toml` source excludes.

## Usage

1. Install `mago` in your project root
2. Install this extension
3. Set Mago Formatter as your default PHP formatter

The extension reads `[source] excludes` from `mago.toml` and skips matching files.
