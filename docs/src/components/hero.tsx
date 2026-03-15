import { cn } from "@/lib/utils";
import { Code, Search, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Code,
    title: "Format",
    description: "70+ formatting settings, 4 presets",
  },
  {
    icon: Search,
    title: "Lint",
    description: "135+ rules across 9 categories",
  },
  {
    icon: Shield,
    title: "Analyze",
    description: "Static analysis with type awareness",
  },
  {
    icon: Zap,
    title: "Fix",
    description: "Safe and unsafe auto-fixes",
  },
];

export function Hero() {
  return (
    <div className="not-prose mb-12">
      <div className="mb-8">
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-4",
            "border border-zinc-200 bg-zinc-50 text-zinc-600",
            "dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400",
          )}
        >
          <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          VS Code Extension
        </div>

        <h1
          className={cn(
            "text-4xl sm:text-5xl font-bold tracking-tight mb-3",
            "bg-linear-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400",
            "bg-clip-text text-transparent",
          )}
        >
          Mago for VS Code
        </h1>

        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
          The definitive extension for the{" "}
          <a
            href="https://github.com/carthage-software/mago"
            className="font-medium underline underline-offset-4 transition-colors hover:opacity-80"
            style={{ color: "var(--color-foreground)" }}
          >
            mago
          </a>{" "}
          PHP toolchain. Formatting, linting, static analysis, and code actions
          — all integrated into VS Code.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className={cn(
              "group rounded-lg p-4 transition-colors",
              "border border-zinc-200 bg-white hover:bg-zinc-50",
              "dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:bg-zinc-800",
            )}
          >
            <feature.icon className="size-4 text-zinc-400 dark:text-zinc-500 mb-2 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors" />
            <div className="font-semibold text-sm mb-0.5 text-zinc-900 dark:text-zinc-100">
              {feature.title}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
              {feature.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
