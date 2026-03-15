"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  readonly title: string;
  readonly href: string;
}

interface NavGroup {
  readonly label: string;
  readonly items: readonly NavItem[];
}

const navigation: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Getting Started", href: "/docs/getting-started" }],
  },
  {
    label: "Reference",
    items: [
      { title: "Configuration", href: "/docs/configuration" },
      { title: "Commands", href: "/docs/commands" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      {navigation.map((group) => (
        <div key={group.label}>
          <h4 className="mb-2 px-3 text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-500">
            {group.label}
          </h4>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block rounded-md px-3 py-1.5 text-sm transition-colors",
                    pathname === item.href
                      ? "bg-zinc-100 text-zinc-900 font-medium dark:bg-zinc-800 dark:text-zinc-100"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/50",
                  )}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
