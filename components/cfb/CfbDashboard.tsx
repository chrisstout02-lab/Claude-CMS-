"use client";

import { useMemo } from "react";
import { useWeeklySlate } from "@/lib/cfb/useWeeklySlate";
import CfbStatTiles from "./CfbStatTiles";
import PicksPanel from "./PicksPanel";
import GamesTable from "./GamesTable";
import WeekSelector from "./WeekSelector";
import Disclaimer from "./Disclaimer";

export default function CfbDashboard() {
  const { slate, summary, week, loading, error, goToWeek, refresh } = useWeeklySlate();

  const gamesById = useMemo(() => new Map((slate?.games ?? []).map((g) => [g.id, g])), [slate]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          College football weekly outlook
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          A weekly summary of the upcoming FBS slate — rankings, records, and lines, plus the games where those
          numbers disagree with the market most.
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <button type="button" onClick={refresh} disabled={loading} className="underline disabled:opacity-50">
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          {slate && <span>As of {new Date(slate.asOf).toLocaleString()}</span>}
        </div>
        {error && (
          <p className="mt-1 text-xs" style={{ color: "var(--status-serious)" }}>
            {error}
          </p>
        )}
      </header>

      <Disclaimer />

      {week !== null && <WeekSelector week={week} onChange={goToWeek} disabled={loading} />}

      {loading && !slate && (
        <div className="p-8 text-sm" style={{ color: "var(--text-muted)" }}>
          Loading this week&apos;s slate…
        </div>
      )}

      {slate && summary && (
        <>
          <CfbStatTiles slate={slate} summary={summary} />

          <section className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
            <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Weekly summary
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {summary.narrative}
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Games that look worth watching
            </h2>
            <PicksPanel picks={summary.picks} gamesById={gamesById} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Full slate
            </h2>
            <GamesTable games={slate.games} />
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              {slate.source === "sample"
                ? "Live scoreboard/odds are unavailable right now — showing illustrative sample data instead."
                : "Lines and moneylines come from ESPN's public scoreboard and can move before kickoff."}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
