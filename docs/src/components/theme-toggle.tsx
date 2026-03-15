"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="size-9" />;
  }

  const ToggleIcon = resolvedTheme === "dark" ? Sun : Moon;

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "inline-flex items-center justify-center rounded-md size-9",
        "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100",
        "dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800",
        "transition-colors cursor-pointer",
      )}
      aria-label="Toggle theme"
    >
      <ToggleIcon className="size-4" />
    </button>
  );
}
