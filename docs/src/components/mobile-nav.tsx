"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center rounded-md size-9 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors lg:hidden cursor-pointer"
        aria-label="Toggle navigation"
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>

      {open && (
        <div
          className={cn(
            "fixed inset-0 top-14 z-50 bg-background/95 backdrop-blur-sm lg:hidden",
          )}
        >
          <div className="p-6" onClick={() => setOpen(false)}>
            <Sidebar />
          </div>
        </div>
      )}
    </>
  );
}
