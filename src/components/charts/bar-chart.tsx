"use client";

import { Bar, BarChart as RBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Datum = { label: string; value: number; detail?: string };

/**
 * Single-series bar chart. One series means one colour and no legend (the card title says
 * what's plotted). Specs: bars ≤ 24px with 4px rounded ends on the data side, hairline
 * grid, muted axis text, hover tooltip. A text summary is given to screen readers, and
 * callers pair it with a table view.
 */
export function BarChart({
  data,
  layout = "vertical",
  unit,
  summary,
  height = 220,
}: {
  data: Datum[];
  layout?: "vertical" | "horizontal"; // vertical = columns over time; horizontal = ranked bars
  unit: string;
  summary: string;
  height?: number;
}) {
  const horizontal = layout === "horizontal";
  const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 };

  return (
    <div role="img" aria-label={summary} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RBarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 16, bottom: 0, left: horizontal ? 8 : -16 }}
          barCategoryGap={2}
        >
          <CartesianGrid stroke="var(--border)" strokeWidth={1} vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" width={96} tick={axisTick} axisLine={false} tickLine={false} />
            </>
          ) : (
            <>
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
            </>
          )}
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as Datum;
              return (
                <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-xs shadow-md">
                  <div className="font-medium">{d.label}</div>
                  <div className="text-muted-foreground">
                    {d.value} {unit}
                    {d.detail && ` · ${d.detail}`}
                  </div>
                </div>
              );
            }}
          />
          <Bar
            dataKey="value"
            fill="var(--viz-bar)"
            maxBarSize={24}
            radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </RBarChart>
      </ResponsiveContainer>
    </div>
  );
}
