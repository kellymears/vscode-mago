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
    headings: [
      "Requirements",
      "Installation",
      "Quick Setup",
      "Binary Resolution",
      "Verify",
    ],
    keywords: [
      "install",
      "setup",
      "begin",
      "start",
      "mago",
      "binary",
      "marketplace",
      "vendor",
      "composer",
      "path",
      "resolve",
    ],
    description:
      "Install the Mago VS Code extension, set up the mago binary, and verify your setup.",
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
