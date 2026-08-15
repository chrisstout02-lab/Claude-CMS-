"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { EnrichedHolding } from "@/lib/types";
import { CATEGORICAL_SERIES, OTHER_SLICE_COLOR } from "@/lib/colors";
import { formatCurrency, formatPercent } from "@/lib/format";

const TOP_N = 7;

export default function AllocationChart({ holdings }: { holdings: EnrichedHolding[] }) {
  const sorted = [...holdings]
    .filter((h) => h.marketValue !== null && h.marketValue > 0)
    .sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0));

  const top = sorted.slice(0, TOP_N);
  const rest = sorted.slice(TOP_N);
  const restValue = rest.reduce((sum, h) => sum + (h.marketValue ?? 0), 0);

  const data = [
    ...top.map((h, i) => ({
      name: h.ticker,
      value: h.marketValue ?? 0,
      weight: h.weight ?? 0,
      color: CATEGORICAL_SERIES[i % CATEGORICAL_SERIES.length],
    })),
    ...(rest.length > 0
      ? [{ name: `Other (${rest.length})`, value: restValue, weight: restValue / (sorted.reduce((s, h) => s + (h.marketValue ?? 0), 0) || 1), color: OTHER_SLICE_COLOR }]
      : []),
  ];

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        No priced holdings to chart yet.
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={data.length > 1 ? 1.5 : 0}
            stroke="var(--surface-1)"
            strokeWidth={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-primary)",
              fontSize: 12,
            }}
            formatter={(value, name, props) => [
              `${formatCurrency(Number(value))} (${formatPercent((props.payload as { weight: number }).weight)})`,
              String(name),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {data.map((entry) => (
          <li key={entry.name} className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
            <span className="tabular-nums">{entry.name}</span>
            <span style={{ color: "var(--text-muted)" }} className="tabular-nums">
              {formatPercent(entry.weight)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
