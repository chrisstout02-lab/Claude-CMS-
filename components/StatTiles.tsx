import type { PortfolioAnalytics } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/format";

export default function StatTiles({ analytics }: { analytics: PortfolioAnalytics }) {
  const gainPositive = analytics.totalGainLoss >= 0;
  const tiles = [
    {
      label: "Portfolio value",
      value: formatCurrency(analytics.totalValue),
      sub: `${analytics.positionCount} position${analytics.positionCount === 1 ? "" : "s"}`,
    },
    {
      label: "Total gain / loss",
      value: formatCurrency(analytics.totalGainLoss),
      sub: formatPercent(analytics.totalGainLossPct),
      tone: gainPositive ? "good" : "critical",
    },
    {
      label: "Diversification score",
      value: `${analytics.diversificationScore.toFixed(0)} / 100`,
      sub: analytics.diversificationScore >= 70 ? "Well diversified" : analytics.diversificationScore >= 40 ? "Moderately concentrated" : "Highly concentrated",
    },
    {
      label: "Largest position",
      value: analytics.topPosition ? analytics.topPosition.ticker : "—",
      sub: analytics.topPosition ? `${formatPercent(analytics.topPosition.weight)} of portfolio` : "",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-lg border p-4"
          style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
        >
          <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {tile.label}
          </div>
          <div
            className="mt-1 text-2xl font-semibold tabular-nums"
            style={{
              color:
                tile.tone === "good"
                  ? "var(--success-text)"
                  : tile.tone === "critical"
                  ? "var(--status-critical)"
                  : "var(--text-primary)",
            }}
          >
            {tile.value}
          </div>
          {tile.sub && (
            <div className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
              {tile.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
