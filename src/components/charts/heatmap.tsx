import { DataTableToggle } from "./data-table-toggle";

const DAYS = [
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
  [0, "Sun"],
] as const;

const STEPS = 6;
const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "a" : "p"}`;

/**
 * Weekday × hour heatmap on a one-hue sequential ramp (--heat-1..6, defined per theme in
 * globals.css). Empty cells use the muted surface. Every cell names its value for
 * screen readers and on hover, and the whole grid is available as a table.
 */
export function Heatmap({
  cells,
  fromHour,
  toHour,
  unit,
}: {
  cells: { dow: number; hour: number; n: number }[];
  fromHour: number;
  toHour: number; // exclusive
  unit: string;
}) {
  const hours = Array.from({ length: Math.max(0, toHour - fromHour) }, (_, i) => fromHour + i);
  const value = (dow: number, hour: number) => cells.find((c) => c.dow === dow && c.hour === hour)?.n ?? 0;
  const max = Math.max(1, ...cells.map((c) => c.n));
  const step = (n: number) => (n === 0 ? 0 : Math.max(1, Math.ceil((n / max) * STEPS)));
  const peak = cells.reduce((a, b) => (b.n > (a?.n ?? 0) ? b : a), undefined as (typeof cells)[number] | undefined);
  const dayName = (dow: number) => DAYS.find((d) => d[0] === dow)?.[1] ?? "";

  return (
    <div>
      <div
        className="overflow-x-auto"
        role="img"
        aria-label={
          peak
            ? `Busiest time: ${dayName(peak.dow)} ${hourLabel(peak.hour)} with ${peak.n} ${unit}.`
            : `No ${unit} yet.`
        }
      >
        <table className="border-separate border-spacing-0.5 text-xs" aria-hidden>
          <thead>
            <tr>
              <th />
              {hours.map((h) => (
                <th key={h} className="text-muted-foreground px-0.5 font-normal">
                  {hourLabel(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(([dow, name]) => (
              <tr key={dow}>
                <th className="text-muted-foreground pr-2 text-left font-normal">{name}</th>
                {hours.map((h) => {
                  const n = value(dow, h);
                  const s = step(n);
                  return (
                    <td
                      key={h}
                      title={`${name} ${hourLabel(h)}: ${n} ${unit}`}
                      className="size-7 min-w-7 rounded-[4px]"
                      style={{ background: s ? `var(--heat-${s})` : "var(--muted)" }}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-muted-foreground mt-2 flex items-center gap-1 text-xs" aria-hidden>
        Fewer
        {Array.from({ length: STEPS }, (_, i) => (
          <span key={i} className="size-3 rounded-sm" style={{ background: `var(--heat-${i + 1})` }} />
        ))}
        More
      </div>
      <DataTableToggle
        columns={["When", unit[0].toUpperCase() + unit.slice(1)]}
        rows={cells
          .filter((c) => c.n > 0)
          .sort((a, b) => b.n - a.n)
          .map((c) => [`${dayName(c.dow)} ${hourLabel(c.hour)}`, c.n])}
      />
    </div>
  );
}
