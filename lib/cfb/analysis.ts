import type { CfbGame, CfbTeam, GamePick, WeeklySlate, WeeklySummary } from "./types";

const EDGE_THRESHOLD_MEDIUM = 6;
const EDGE_THRESHOLD_HIGH = 12;

/**
 * A simple, transparent power rating so "edge" below has something to compare the market
 * line to. It is a rough proxy (rank + win rate), not a predictive model — treat every
 * output of this file as a talking point, not a forecast.
 */
function powerScore(t: CfbTeam): number {
  const rankComponent = t.rank ? (26 - t.rank) * 2 : 0;
  const games = t.wins + t.losses;
  const winPct = games > 0 ? t.wins / games : 0.5;
  return rankComponent + winPct * 20;
}

/** Positive => model rates the home team better than the market spread implies. */
function marketEdge(game: CfbGame): number | null {
  if (game.odds?.spread == null) return null;
  const modelDiff = powerScore(game.home) - powerScore(game.away);
  const marketDiff = -game.odds.spread;
  return modelDiff - marketDiff;
}

function confidenceFromEdge(edge: number): "high" | "medium" | "low" {
  const abs = Math.abs(edge);
  if (abs >= EDGE_THRESHOLD_HIGH) return "high";
  if (abs >= EDGE_THRESHOLD_MEDIUM) return "medium";
  return "low";
}

function teamLabel(t: CfbTeam): string {
  return t.rank ? `#${t.rank} ${t.shortName}` : t.shortName;
}

export function buildPicks(games: CfbGame[]): GamePick[] {
  const picks: GamePick[] = [];

  for (const game of games) {
    if (game.completed) continue;

    if (game.home.rank && game.away.rank) {
      const gap = Math.abs(game.home.rank - game.away.rank);
      picks.push({
        gameId: game.id,
        category: "marquee",
        confidence: gap <= 10 ? "high" : "medium",
        headline: `${teamLabel(game.away)} at ${teamLabel(game.home)}`,
        reasoning: `Both teams are ranked in the Top 25${
          gap <= 5 ? " and closely matched" : ""
        } — this is the kind of game likely to affect the national picture regardless of the line.`,
      });
      continue;
    }

    const edge = marketEdge(game);
    if (edge === null) continue;
    const confidence = confidenceFromEdge(edge);
    if (confidence === "low") continue;

    if (edge > 0) {
      picks.push({
        gameId: game.id,
        category: "lean-favorite",
        confidence,
        headline: `${teamLabel(game.home)} vs. ${teamLabel(game.away)}`,
        reasoning: `Rank and record put ${game.home.shortName} well ahead of what the ${
          game.odds?.spread != null ? `${Math.abs(game.odds.spread)}-point spread` : "market line"
        } suggests — a market gap worth a second look before assuming the line is fair.`,
      });
    } else {
      picks.push({
        gameId: game.id,
        category: "lean-underdog",
        confidence,
        headline: `${teamLabel(game.away)} vs. ${teamLabel(game.home)}`,
        reasoning: `${game.away.shortName} rates closer to ${game.home.shortName} than the current line implies — a possible trap game for anyone assuming the favorite cruises.`,
      });
    }
  }

  return picks.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.confidence] - rank[b.confidence];
  });
}

export function buildWeeklySummary(slate: WeeklySlate): WeeklySummary {
  const upcoming = slate.games.filter((g) => !g.completed);
  const picks = buildPicks(slate.games);
  const rankedMatchups = slate.games.filter((g) => g.home.rank && g.away.rank).length;
  const gamesWithOdds = slate.games.filter((g) => g.odds?.spread != null).length;

  const marquee = picks.filter((p) => p.category === "marquee");
  const leans = picks.filter((p) => p.category !== "marquee");
  const highConfidenceLeans = leans.filter((p) => p.confidence === "high");

  const parts: string[] = [];
  parts.push(
    `Week ${slate.week} of the ${slate.seasonYear} season has ${upcoming.length} FBS matchup${
      upcoming.length === 1 ? "" : "s"
    } on the board${gamesWithOdds > 0 ? `, with lines available for ${gamesWithOdds} of them` : ""}.`
  );
  if (marquee.length > 0) {
    parts.push(
      `${marquee.length} game${marquee.length === 1 ? "" : "s"} feature two ranked teams, headlined by ${
        marquee[0].headline
      }.`
    );
  }
  if (highConfidenceLeans.length > 0) {
    parts.push(
      `${highConfidenceLeans.length} game${
        highConfidenceLeans.length === 1 ? "" : "s"
      } show a notable gap between team strength and the posted line — worth a closer look: ${highConfidenceLeans
        .slice(0, 3)
        .map((p) => p.headline)
        .join("; ")}.`
    );
  } else if (leans.length === 0) {
    parts.push("No games stand out as mispriced this week based on rank and record alone — mostly chalk.");
  }
  parts.push(
    "These are talking points from public rankings, records, and posted lines — not a prediction, and not a reason to bet more than you can afford to lose."
  );

  return {
    narrative: parts.join(" "),
    picks,
    rankedMatchups,
    gamesWithOdds,
  };
}
