"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, formatPercent } from "@/lib/format";

export interface BarBreakdownItem {
  label: string;
  value: number;
  weight: number;
  tickers: string[];
}

export default function BarBreakdown({ items }: { items: BarBreakdownItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        No data yet.
      </div>
    );
  }

  const height = Math.max(140, items.length * 36);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={items} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 0 }}>
        <CartesianGrid horizontal={false} stroke="var(--gridline)" />
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <YAxis
          type="category"
          dataKey="label"
          width={140}
          tickLine={false}
          axisLine={{ stroke: "var(--baseline)" }}
          tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "var(--gridline)" }}
          contentStyle={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--text-primary)",
            fontSize: 12,
          }}
          formatter={(value, _name, props) => {
            const payload = props.payload as { weight: number; tickers: string[] };
            return [
              `${formatCurrency(Number(value))} (${formatPercent(payload.weight)}) — ${payload.tickers.join(", ")}`,
              "Value",
            ];
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {items.map((item) => (
            <Cell key={item.label} fill="var(--series-1)" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
