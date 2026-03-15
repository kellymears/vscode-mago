import { cn } from "@/lib/utils";

interface SettingMetaProps {
  readonly type: string;
  readonly defaultValue: string;
}

export function SettingMeta({ type, defaultValue }: SettingMetaProps) {
  return (
    <div
      className={cn(
        "not-prose flex flex-wrap gap-x-6 gap-y-2 text-sm mb-4 px-3 py-2.5 rounded-lg",
        "bg-zinc-50 dark:bg-zinc-800/50",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-zinc-500 dark:text-zinc-500">Type</span>
        <code
          className={cn(
            "text-xs px-1.5 py-0.5 rounded font-mono",
            "bg-zinc-200/70 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
          )}
        >
          {type}
        </code>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-zinc-500 dark:text-zinc-500">Default</span>
        <code
          className={cn(
            "text-xs px-1.5 py-0.5 rounded font-mono",
            "bg-zinc-200/70 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
          )}
        >
          {defaultValue}
        </code>
      </div>
    </div>
  );
}
