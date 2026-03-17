import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Header } from "@/components/header";
import { CopyButton } from "@/components/copy-button";

export const metadata: Metadata = {
  title: { absolute: "Mago for VS Code" },
  description:
    "PHP formatting, linting, and static analysis extension for VS Code.",
};

const INSTALL_CMD = "code --install-extension kellymears.vscode-mago";
const MARKETPLACE_URL =
  "https://marketplace.visualstudio.com/items?itemName=kellymears.vscode-mago";

interface ConfigItem {
  title: string;
  description: string;
  snippet?: string;
  action?: string;
}

const configs: ConfigItem[] = [
  {
    title: "Linting",
    description: "Diagnostics from 135+ rules on save.",
    snippet: '"mago.lint.enabled": true',
  },
  {
    title: "Analysis",
    description: "Static analysis in the Problems panel.",
    snippet: '"mago.analyze.enabled": true',
  },
  {
    title: "Lint on Type",
    description: "Real-time feedback as you write.",
    snippet: '"mago.lint.run": "onType"',
  },
  {
    title: "Fix File",
    description: "Auto-fix from the command palette.",
    action: "\u2318\u21E7P \u2192 Mago: Fix File (Safe)",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-6">
        {/* Hero */}
        <section className="pt-28 sm:pt-36 pb-20">
          <h1 className="animate-[fade-up_0.6s_ease-out_both]">
            <span className="block text-5xl sm:text-7xl font-bold tracking-tight">
              Mago
            </span>
            <span className="block text-xl sm:text-2xl text-muted-foreground mt-2">
              for VS Code
            </span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-lg animate-[fade-up_0.6s_ease-out_both] [animation-delay:100ms]">
            PHP formatting, linting, and static analysis &mdash; powered by the{" "}
            <a
              href="https://github.com/carthage-software/mago"
              className="text-emerald-600 dark:text-emerald-400 underline underline-offset-4 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors"
            >
              mago
            </a>{" "}
            toolchain.
          </p>

          {/* Install command */}
          <div className="mt-10 animate-[fade-up_0.6s_ease-out_both] [animation-delay:200ms]">
            <div className="inline-flex max-w-full items-center gap-3 bg-zinc-950 dark:bg-zinc-900 text-zinc-300 rounded-lg pl-5 pr-3 py-3.5 font-mono text-sm border border-zinc-800 dark:border-zinc-700/50 shadow-lg dark:shadow-zinc-950/50 overflow-x-auto">
              <span className="text-emerald-400 select-none" aria-hidden="true">
                $
              </span>
              <code className="select-all whitespace-nowrap">{INSTALL_CMD}</code>
              <CopyButton
                text={INSTALL_CMD}
                className="text-zinc-500 hover:text-zinc-300 ml-1 p-1 -mr-1 rounded shrink-0"
              />
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4 animate-[fade-up_0.6s_ease-out_both] [animation-delay:300ms]">
            <a
              href={MARKETPLACE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-7 py-3.5 rounded-lg transition-all duration-300 shadow-[0_4px_14px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.45)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Install from Marketplace
              <ExternalLink className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <Link
              href="/docs/getting-started"
              className="group inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium px-2 py-3.5 transition-colors duration-200"
            >
              Read the docs
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Requirement note */}
          <p className="mt-6 text-sm text-muted-foreground animate-[fade-up_0.6s_ease-out_both] [animation-delay:400ms]">
            Requires the{" "}
            <a
              href="https://github.com/carthage-software/mago"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              mago CLI
            </a>
            .
          </p>
        </section>

        {/* Config */}
        <section className="pb-24 border-t border-border pt-16">
          <div className="animate-[fade-up_0.6s_ease-out_both] [animation-delay:500ms]">
            <h2 className="text-xl font-semibold tracking-tight">Configure</h2>
            <p className="mt-2 text-muted-foreground">
              Formatting works out of the box. Add what you need.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {configs.map((config, i) => (
              <div
                key={config.title}
                className="rounded-lg border border-border p-5 transition-all duration-200 hover:border-zinc-400 dark:hover:border-zinc-500 hover:shadow-sm animate-[fade-up_0.5s_ease-out_both]"
                style={{ animationDelay: `${600 + i * 75}ms` }}
              >
                <h3 className="font-semibold text-sm">{config.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {config.description}
                </p>
                {config.snippet ? (
                  <div className="mt-3 flex items-center justify-between gap-2 bg-zinc-950 dark:bg-zinc-900 rounded-md px-3 py-2 border border-zinc-800 dark:border-zinc-700/50">
                    <code className="text-xs font-mono text-zinc-300 select-all">
                      {config.snippet}
                    </code>
                    <CopyButton
                      text={config.snippet}
                      className="text-zinc-600 hover:text-zinc-300 p-0.5 rounded shrink-0"
                    />
                  </div>
                ) : config.action ? (
                  <div className="mt-3 bg-zinc-950 dark:bg-zinc-900 rounded-md px-3 py-2 border border-zinc-800 dark:border-zinc-700/50">
                    <code className="text-xs font-mono text-zinc-300">{config.action}</code>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
