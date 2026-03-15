"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const pages = [
  { title: "Getting Started", href: "/docs/getting-started" },
  { title: "Configuration", href: "/docs/configuration" },
  { title: "Commands", href: "/docs/commands" },
];

export function PageNav() {
  const pathname = usePathname();
  const currentIndex = pages.findIndex((p) => p.href === pathname);

  if (currentIndex === -1) return null;

  const prev = currentIndex > 0 ? pages[currentIndex - 1] : undefined;
  const next =
    currentIndex < pages.length - 1 ? pages[currentIndex + 1] : undefined;

  return (
    <nav
      className={cn(
        "mt-12 flex flex-col sm:flex-row items-stretch gap-4 border-t pt-6",
        "border-zinc-200 dark:border-zinc-800",
      )}
    >
      {prev ? (
        <Link
          href={prev.href}
          className={cn(
            "group flex flex-1 items-center gap-3 rounded-lg border p-4 transition-colors",
            "border-zinc-200 hover:bg-zinc-50",
            "dark:border-zinc-800 dark:hover:bg-zinc-800/50",
          )}
        >
          <ArrowLeft className="size-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors shrink-0" />
          <div className="text-right flex-1">
            <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-0.5">
              Previous
            </div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {prev.title}
            </div>
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {next ? (
        <Link
          href={next.href}
          className={cn(
            "group flex flex-1 items-center gap-3 rounded-lg border p-4 transition-colors",
            "border-zinc-200 hover:bg-zinc-50",
            "dark:border-zinc-800 dark:hover:bg-zinc-800/50",
          )}
        >
          <div className="flex-1">
            <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-0.5">
              Next
            </div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {next.title}
            </div>
          </div>
          <ArrowRight className="size-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors shrink-0" />
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  );
}
