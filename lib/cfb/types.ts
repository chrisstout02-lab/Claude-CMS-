export interface CfbTeam {
  id: string;
  displayName: string;
  shortName: string;
  abbreviation: string;
  rank: number | null;
  wins: number;
  losses: number;
  logo: string | null;
}

export interface CfbOdds {
  provider: string | null;
  /** Home-relative spread. Negative means the home team is favored by that many points. */
  spread: number | null;
  favorite: "home" | "away" | null;
  overUnder: number | null;
  homeMoneyline: number | null;
  awayMoneyline: number | null;
}

export interface CfbGame {
  id: string;
  startDate: string;
  shortName: string;
  venue: string | null;
  broadcast: string | null;
  neutralSite: boolean;
  conferenceGame: boolean;
  home: CfbTeam;
  away: CfbTeam;
  odds: CfbOdds | null;
  statusDetail: string;
  completed: boolean;
  homeScore: number | null;
  awayScore: number | null;
}

export type SlateSource = "live" | "sample";

export interface WeeklySlate {
  week: number;
  seasonYear: number;
  seasonType: number;
  games: CfbGame[];
  source: SlateSource;
  asOf: string;
}

export type PickCategory = "marquee" | "lean-favorite" | "lean-underdog";
export type PickConfidence = "high" | "medium" | "low";

export interface GamePick {
  gameId: string;
  category: PickCategory;
  confidence: PickConfidence;
  headline: string;
  reasoning: string;
}

export interface WeeklySummary {
  narrative: string;
  picks: GamePick[];
  rankedMatchups: number;
  gamesWithOdds: number;
}
