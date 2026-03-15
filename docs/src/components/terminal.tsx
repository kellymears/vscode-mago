interface TerminalProps {
  readonly children: string;
}

export function Terminal({ children }: TerminalProps) {
  const lines = children.trimEnd().split("\n");

  return (
    <div className="mb-4 rounded-lg overflow-hidden border border-zinc-700/50">
      <div className="flex items-center px-4 py-2.5 bg-zinc-800 border-b border-zinc-700/50">
        <div className="flex items-center gap-2" aria-hidden>
          <span className="size-3 rounded-full bg-[#FF5F57]" />
          <span className="size-3 rounded-full bg-[#FEBC2E]" />
          <span className="size-3 rounded-full bg-[#28C840]" />
        </div>
      </div>

      <div className="p-4 bg-zinc-950 text-sm font-mono leading-relaxed overflow-x-auto">
        {lines.map((line, i) => (
          <TerminalLine key={i} line={line} />
        ))}
      </div>
    </div>
  );
}

function TerminalLine({ line }: { readonly line: string }) {
  if (line.trim() === "") {
    return <div>{"\u00A0"}</div>;
  }

  if (line.trimStart().startsWith("#")) {
    return <div className="text-zinc-500">{line}</div>;
  }

  return (
    <div className="text-zinc-200">
      <span className="text-fuchsia-400 select-none">{"❯ "}</span>
      {line}
    </div>
  );
}
