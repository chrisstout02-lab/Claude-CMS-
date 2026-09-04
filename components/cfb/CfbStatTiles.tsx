import type { WeeklySlate, WeeklySummary } from "@/lib/cfb/types";

export default function CfbStatTiles({ slate, summary }: { slate: WeeklySlate; summary: WeeklySummary }) {
  const highConfidencePicks = summary.picks.filter((p) => p.confidence === "high").length;

  const tiles = [
    { label: "Games this week", value: String(slate.games.length), sub: `Week ${slate.week} · ${slate.seasonYear}` },
    { label: "Ranked matchups", value: String(summary.rankedMatchups), sub: "Both teams in the Top 25" },
    {
      label: "Highlighted picks",
      value: String(summary.picks.length),
      sub: highConfidencePicks > 0 ? `${highConfidencePicks} high-confidence` : "Talking points, not predictions",
    },
    {
      label: "Data source",
      value: slate.source === "live" ? "Live" : "Sample",
      sub: slate.source === "live" ? "ESPN scoreboard" : "Illustrative fallback data",
      tone: slate.source === "live" ? "good" : undefined,
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
            style={{ color: tile.tone === "good" ? "var(--success-text)" : "var(--text-primary)" }}
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
