import { NextRequest, NextResponse } from "next/server";
import type { CfbGame, CfbOdds, CfbTeam, WeeklySlate } from "@/lib/cfb/types";
import { getSampleSlate } from "@/lib/cfb/sampleWeek";

export const dynamic = "force-dynamic";

interface CacheEntry {
  data: WeeklySlate;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

interface EspnCompetitor {
  homeAway: "home" | "away";
  team: { id: string; displayName: string; shortDisplayName: string; abbreviation: string; logo?: string };
  curatedRank?: { current: number };
  records?: { type: string; summary: string }[];
  score?: string;
}

interface EspnOdds {
  provider?: { name: string };
  spread?: number;
  overUnder?: number;
  homeTeamOdds?: { favorite?: boolean; moneyLine?: number };
  awayTeamOdds?: { favorite?: boolean; moneyLine?: number };
}

interface EspnEvent {
  id: string;
  date: string;
  shortName: string;
  competitions: {
    neutralSite?: boolean;
    conferenceCompetition?: boolean;
    venue?: { fullName?: string };
    broadcasts?: { names?: string[] }[];
    competitors: EspnCompetitor[];
    odds?: EspnOdds[];
    status?: { type?: { shortDetail?: string; completed?: boolean } };
  }[];
}

function parseRecord(competitor: EspnCompetitor): { wins: number; losses: number } {
  const summary = competitor.records?.find((r) => r.type === "total")?.summary ?? "0-0";
  const [wins, losses] = summary.split("-").map((n) => parseInt(n, 10));
  return { wins: Number.isFinite(wins) ? wins : 0, losses: Number.isFinite(losses) ? losses : 0 };
}

function toTeam(competitor: EspnCompetitor): CfbTeam {
  const rank = competitor.curatedRank?.current;
  const { wins, losses } = parseRecord(competitor);
  return {
    id: competitor.team.id,
    displayName: competitor.team.displayName,
    shortName: competitor.team.shortDisplayName || competitor.team.displayName,
    abbreviation: competitor.team.abbreviation,
    rank: rank && rank < 99 ? rank : null,
    wins,
    losses,
    logo: competitor.team.logo ?? null,
  };
}

function toOdds(odds: EspnOdds[] | undefined): CfbOdds | null {
  const primary = odds?.[0];
  if (!primary) return null;
  const favorite = primary.homeTeamOdds?.favorite ? "home" : primary.awayTeamOdds?.favorite ? "away" : null;
  return {
    provider: primary.provider?.name ?? null,
    spread: typeof primary.spread === "number" ? primary.spread : null,
    favorite,
    overUnder: typeof primary.overUnder === "number" ? primary.overUnder : null,
    homeMoneyline: primary.homeTeamOdds?.moneyLine ?? null,
    awayMoneyline: primary.awayTeamOdds?.moneyLine ?? null,
  };
}

function toGame(event: EspnEvent): CfbGame | null {
  const competition = event.competitions?.[0];
  if (!competition) return null;
  const home = competition.competitors.find((c) => c.homeAway === "home");
  const away = competition.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const completed = competition.status?.type?.completed ?? false;

  return {
    id: event.id,
    startDate: event.date,
    shortName: event.shortName,
    venue: competition.venue?.fullName ?? null,
    broadcast: competition.broadcasts?.[0]?.names?.[0] ?? null,
    neutralSite: competition.neutralSite ?? false,
    conferenceGame: competition.conferenceCompetition ?? false,
    home: toTeam(home),
    away: toTeam(away),
    odds: toOdds(competition.odds),
    statusDetail: competition.status?.type?.shortDetail ?? "",
    completed,
    homeScore: completed && home.score ? parseInt(home.score, 10) : null,
    awayScore: completed && away.score ? parseInt(away.score, 10) : null,
  };
}

interface LiveFetchResult {
  slate: WeeklySlate | null;
  error: string | null;
}

async function fetchLiveSlate(week: string | null, year: string | null, seasontype: string | null): Promise<LiveFetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const params = new URLSearchParams({ groups: "80", limit: "150" });
    if (week) params.set("week", week);
    if (year) params.set("year", year);
    if (seasontype) params.set("seasontype", seasontype);

    const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?${params.toString()}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.espn.com/college-football/scoreboard",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return { slate: null, error: `ESPN responded with HTTP ${res.status}` };
    }
    const json = await res.json();

    const events: EspnEvent[] = json?.events ?? [];
    const games = events.map(toGame).filter((g): g is CfbGame => g !== null);
    if (games.length === 0) {
      return { slate: null, error: "ESPN returned no games for this week (likely off-season, or the response shape changed)" };
    }

    return {
      slate: {
        week: json?.week?.number ?? (week ? parseInt(week, 10) : 0),
        seasonYear: json?.season?.year ?? (year ? parseInt(year, 10) : new Date().getFullYear()),
        seasonType: json?.season?.type ?? (seasontype ? parseInt(seasontype, 10) : 2),
        games,
        source: "live",
        asOf: new Date().toISOString(),
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { slate: null, error: controller.signal.aborted ? "Request to ESPN timed out" : message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const week = request.nextUrl.searchParams.get("week");
  const year = request.nextUrl.searchParams.get("year");
  const seasontype = request.nextUrl.searchParams.get("seasontype");

  const cacheKey = `${week ?? "current"}:${year ?? "current"}:${seasontype ?? "2"}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ slate: cached.data });
  }

  const { slate: live, error } = await fetchLiveSlate(week, year, seasontype);
  const slate = live ?? getSampleSlate(week ? parseInt(week, 10) : 2, year ? parseInt(year, 10) : new Date().getFullYear());

  cache.set(cacheKey, { data: slate, expiresAt: Date.now() + CACHE_TTL_MS });
  // liveFetchError is only present when the sample fallback was used, to make diagnosing
  // production issues possible without needing access to server logs.
  return NextResponse.json({ slate, liveFetchError: live ? null : error });
}
