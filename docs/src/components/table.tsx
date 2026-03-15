import { cn } from "@/lib/utils";

interface TableProps {
  readonly headers: readonly string[];
  readonly rows: readonly (readonly React.ReactNode[])[];
}

export function Table({ headers, rows }: TableProps) {
  return (
    <div className="not-prose mb-6 overflow-x-auto">
      <table
        className={cn(
          "w-full text-sm border-collapse",
        )}
      >
        <thead>
          <tr className="border-b-2 border-zinc-200 dark:border-zinc-700">
            {headers.map((header, i) => (
              <th
                key={i}
                className="text-left font-semibold p-3 text-zinc-900 dark:text-zinc-100"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              {row.map((cell, j) => (
                <td key={j} className="p-3 text-zinc-700 dark:text-zinc-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
