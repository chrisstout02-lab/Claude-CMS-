import type { CfbGame, GamePick, PickConfidence } from "@/lib/cfb/types";

const CONFIDENCE_META: Record<PickConfidence, { label: string; color: string }> = {
  high: { label: "High confidence", color: "var(--status-good)" },
  medium: { label: "Medium confidence", color: "var(--status-warning)" },
  low: { label: "Low confidence", color: "var(--text-muted)" },
};

const CATEGORY_LABEL: Record<GamePick["category"], string> = {
  marquee: "Marquee matchup",
  "lean-favorite": "Line looks soft on the favorite",
  "lean-underdog": "Possible upset alert",
};

export default function PicksPanel({ picks, gamesById }: { picks: GamePick[]; gamesById: Map<string, CfbGame> }) {
  if (picks.length === 0) {
    return (
      <div
        className="rounded-lg border p-4 text-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-secondary)" }}
      >
        No standout games this week based on rank, record, and posted lines — a fairly chalky slate.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {picks.map((pick) => {
        const game = gamesById.get(pick.gameId);
        const meta = CONFIDENCE_META[pick.confidence];
        return (
          <li key={pick.gameId + pick.category} className="rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium" style={{ color: meta.color }}>
                {meta.label}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                · {CATEGORY_LABEL[pick.category]}
              </span>
              {game && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  · {game.statusDetail}
                </span>
              )}
            </div>
            <div className="mt-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {pick.headline}
            </div>
            <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {pick.reasoning}
            </p>
            {game?.odds && (
              <div className="mt-1 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                {game.odds.spread != null && `Spread ${game.odds.spread > 0 ? "+" : ""}${game.odds.spread}`}
                {game.odds.overUnder != null && ` · O/U ${game.odds.overUnder}`}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
