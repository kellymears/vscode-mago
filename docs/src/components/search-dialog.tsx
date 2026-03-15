"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { FileText, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { search, type SearchEntry } from "@/lib/search";

interface SearchResult {
  readonly entry: SearchEntry;
  readonly score: number;
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }, [open]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setActiveIndex(0);
    if (value.trim().length === 0) {
      setResults([]);
      return;
    }
    setResults(search(value));
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[activeIndex]) {
        e.preventDefault();
        navigate(results[activeIndex].entry.href);
      }
    },
    [results, activeIndex, navigate],
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm",
            "border border-zinc-200 bg-white text-zinc-500",
            "hover:bg-zinc-50 hover:text-zinc-700",
            "dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400",
            "dark:hover:bg-zinc-800 dark:hover:text-zinc-300",
            "transition-colors w-56 justify-between cursor-pointer",
          )}
        >
          <span className="flex items-center gap-2">
            <Search className="size-3.5" />
            Search...
          </span>
          <kbd
            className={cn(
              "pointer-events-none hidden select-none items-center gap-0.5 rounded",
              "border border-zinc-200 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-700",
              "px-1.5 py-0.5 font-mono text-[10px] font-medium",
              "text-zinc-500 dark:text-zinc-400 sm:flex",
            )}
          >
            <span className="text-xs">&#8984;</span>K
          </kbd>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg",
            "rounded-xl border shadow-lg",
            "border-zinc-200 bg-white text-zinc-900",
            "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          <VisuallyHidden.Root>
            <Dialog.Title>Search documentation</Dialog.Title>
          </VisuallyHidden.Root>

          <div className="flex items-center border-b border-zinc-200 dark:border-zinc-700 px-4">
            <Search className="size-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search documentation..."
              className="flex-1 bg-transparent py-3 px-3 text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100"
              autoFocus
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {query.length > 0 && results.length === 0 && (
              <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No results found.
              </p>
            )}

            {results.map((result, index) => (
              <button
                key={result.entry.href}
                onClick={() => navigate(result.entry.href)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors cursor-pointer",
                  index === activeIndex
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : "text-zinc-500 dark:text-zinc-400",
                )}
              >
                <FileText className="size-4 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {result.entry.title}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {result.entry.description}
                  </div>
                </div>
                <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
                  {result.entry.section}
                </span>
              </button>
            ))}

            {query.length === 0 && (
              <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Type to search the documentation.
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
