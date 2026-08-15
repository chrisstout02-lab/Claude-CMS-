"use client";

import { useMemo, useState } from "react";
import type { EnrichedHolding } from "@/lib/types";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format";

type SortKey =
  | "ticker"
  | "weight"
  | "marketValue"
  | "gainLossPct"
  | "marketCap"
  | "peRatio"
  | "grossMargin"
  | "profitMargin"
  | "revenueTTM"
  | "revenueGrowthYoY";

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "ticker", label: "Holding" },
  { key: "weight", label: "Weight", align: "right" },
  { key: "marketValue", label: "Value", align: "right" },
  { key: "gainLossPct", label: "Gain/Loss", align: "right" },
  { key: "marketCap", label: "Market Cap", align: "right" },
  { key: "peRatio", label: "P/E", align: "right" },
  { key: "grossMargin", label: "Gross Margin", align: "right" },
  { key: "profitMargin", label: "Profit Margin", align: "right" },
  { key: "revenueTTM", label: "Revenue (TTM)", align: "right" },
  { key: "revenueGrowthYoY", label: "Rev Growth YoY", align: "right" },
];

function getSortValue(h: EnrichedHolding, key: SortKey): number | string {
  switch (key) {
    case "ticker":
      return h.ticker;
    case "weight":
      return h.weight ?? -Infinity;
    case "marketValue":
      return h.marketValue ?? -Infinity;
    case "gainLossPct":
      return h.gainLossPct ?? -Infinity;
    case "marketCap":
      return h.fundamentals?.marketCap ?? -Infinity;
    case "peRatio":
      return h.fundamentals?.peRatio ?? -Infinity;
    case "grossMargin":
      return h.fundamentals?.grossMargin ?? -Infinity;
    case "profitMargin":
      return h.fundamentals?.profitMargin ?? -Infinity;
    case "revenueTTM":
      return h.fundamentals?.revenueTTM ?? -Infinity;
    case "revenueGrowthYoY":
      return h.fundamentals?.revenueGrowthYoY ?? -Infinity;
  }
}

export default function MetricsTable({ holdings }: { holdings: EnrichedHolding[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("weight");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...holdings];
    copy.sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      const cmp = typeof av === "string" && typeof bv === "string" ? av.localeCompare(bv) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [holdings, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  if (holdings.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        No holdings yet — import a CSV or add one manually.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`cursor-pointer select-none whitespace-nowrap px-3 py-2 text-xs font-medium ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
                style={{ color: "var(--text-secondary)" }}
              >
                {col.label}
                {sortKey === col.key && <span style={{ color: "var(--text-muted)" }}> {sortDir === "asc" ? "↑" : "↓"}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((h) => {
            const f = h.fundamentals;
            const gainPositive = (h.gainLossPct ?? 0) >= 0;
            return (
              <tr key={h.ticker} style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                    {h.ticker}
                    {f?.assetType === "ETF" && (
                      <span
                        className="ml-1.5 rounded px-1 py-0.5 text-[10px] font-medium"
                        style={{ background: "var(--gridline)", color: "var(--text-secondary)" }}
                      >
                        ETF
                      </span>
                    )}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {f?.name ?? "—"} {f?.source === "fallback" && "· static ref."} {f?.source === "unknown" && "· unmatched"}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatPercent(h.weight)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatCurrency(h.marketValue)}</td>
                <td
                  className="whitespace-nowrap px-3 py-2 text-right tabular-nums"
                  style={{ color: h.gainLossPct === null ? "var(--text-muted)" : gainPositive ? "var(--success-text)" : "var(--status-critical)" }}
                >
                  {formatPercent(h.gainLossPct)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatCompact(f?.marketCap ?? null)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{f?.peRatio ? f.peRatio.toFixed(1) : "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatPercent(f?.grossMargin ?? null)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatPercent(f?.profitMargin ?? null)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatCompact(f?.revenueTTM ?? null)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatPercent(f?.revenueGrowthYoY ?? null)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
