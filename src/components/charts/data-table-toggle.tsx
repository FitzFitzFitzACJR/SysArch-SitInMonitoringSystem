import type { ReactNode } from "react";

/** "Show as table" under a chart, so every value is readable without the chart. */
export function DataTableToggle({ columns, rows }: { columns: [string, string]; rows: [ReactNode, ReactNode][] }) {
  return (
    <details className="mt-2 text-sm">
      <summary className="text-muted-foreground cursor-pointer text-xs hover:underline">Show as table</summary>
      <table className="mt-2 w-full text-left">
        <thead>
          <tr className="text-muted-foreground border-b text-xs">
            <th className="py-1 font-normal">{columns[0]}</th>
            <th className="py-1 text-right font-normal">{columns[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b], i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-1">{a}</td>
              <td className="py-1 text-right tabular-nums">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
