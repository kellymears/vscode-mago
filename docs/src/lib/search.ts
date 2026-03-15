export interface SearchEntry {
  readonly title: string;
  readonly href: string;
  readonly section: string;
  readonly headings: readonly string[];
  readonly keywords: readonly string[];
  readonly description: string;
}

const entries: SearchEntry[] = [
  {
    title: "Getting Started",
    href: "/docs/getting-started",
    section: "Overview",
    headings: ["Requirements", "Installation", "Quick Setup", "Verify"],
    keywords: [
      "install",
      "setup",
      "begin",
      "start",
      "mago",
      "binary",
      "marketplace",
    ],
    description: "Install the Mago VS Code extension and verify your setup.",
  },
  {
    title: "Configuration",
    href: "/docs/configuration",
    section: "Reference",
    headings: [
      "mago.enabled",
      "mago.bin",
      "mago.configPath",
      "mago.phpVersion",
      "mago.lint.enabled",
      "mago.lint.run",
      "mago.analyze.enabled",
      "mago.format.enabled",
      "mago.trace.level",
    ],
    keywords: [
      "settings",
      "options",
      "config",
      "enable",
      "disable",
      "path",
      "binary",
      "php",
      "version",
      "lint",
      "onSave",
      "onType",
      "analyze",
      "format",
      "trace",
      "log",
      "debug",
      "mago.toml",
    ],
    description: "All VS Code extension settings and their defaults.",
  },
  {
    title: "Commands",
    href: "/docs/commands",
    section: "Reference",
    headings: [
      "Format File",
      "Lint File",
      "Lint Workspace",
      "Analyze File",
      "Analyze Workspace",
      "Fix File",
      "Fix File (Unsafe)",
      "Show Output",
      "Restart",
      "Explain Rule",
    ],
    keywords: [
      "command",
      "palette",
      "format",
      "lint",
      "analyze",
      "fix",
      "unsafe",
      "restart",
      "output",
      "explain",
      "rule",
      "keyboard",
    ],
    description: "All command palette commands and what they do.",
  },
  {
    title: "Formatting",
    href: "/docs/formatting",
    section: "Features",
    headings: [
      "Format on Save",
      "Manual Formatting",
      "How It Works",
      "Formatter Settings",
    ],
    keywords: [
      "format",
      "prettier",
      "stdin",
      "mago.toml",
      "style",
      "indent",
      "format-on-save",
      "default formatter",
    ],
    description: "Format PHP files in VS Code using the mago formatter.",
  },
  {
    title: "Diagnostics",
    href: "/docs/diagnostics",
    section: "Features",
    headings: [
      "Lint Diagnostics",
      "Analyzer Diagnostics",
      "Severity Mapping",
      "On-Save vs On-Type",
      "Workspace-Level",
    ],
    keywords: [
      "lint",
      "analyze",
      "diagnostic",
      "error",
      "warning",
      "hint",
      "problems",
      "panel",
      "save",
      "type",
      "debounce",
      "severity",
      "workspace",
      "file",
    ],
    description:
      "Real-time lint and analysis diagnostics in the Problems panel.",
  },
  {
    title: "Code Actions",
    href: "/docs/code-actions",
    section: "Features",
    headings: ["Quick Fixes", "Fix All", "Safe vs Unsafe", "Applying Fixes"],
    keywords: [
      "fix",
      "quickfix",
      "lightbulb",
      "safe",
      "unsafe",
      "potentially",
      "code action",
      "source action",
      "auto fix",
    ],
    description: "Apply quick fixes and batch fixes from mago suggestions.",
  },
  {
    title: "Binary Resolution",
    href: "/docs/binary-resolution",
    section: "Reference",
    headings: ["Resolution Order", "Custom Path", "Troubleshooting"],
    keywords: [
      "binary",
      "path",
      "vendor",
      "composer",
      "global",
      "which",
      "not found",
      "missing",
      "resolve",
      "install",
    ],
    description: "How the extension finds the mago binary.",
  },
];

interface SearchResult {
  readonly entry: SearchEntry;
  readonly score: number;
}

export function search(query: string): SearchResult[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  if (terms.length === 0) return [];

  const results: SearchResult[] = [];

  for (const entry of entries) {
    let score = 0;
    const titleLower = entry.title.toLowerCase();
    const descLower = entry.description.toLowerCase();

    for (const term of terms) {
      if (titleLower.includes(term)) score += 10;
      if (entry.headings.some((h) => h.toLowerCase().includes(term)))
        score += 5;
      if (entry.keywords.some((k) => k.includes(term))) score += 3;
      if (descLower.includes(term)) score += 1;
    }

    if (score > 0) {
      results.push({ entry, score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export function getAllEntries(): SearchEntry[] {
  return entries;
}
