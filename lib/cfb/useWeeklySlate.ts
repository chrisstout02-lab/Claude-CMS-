"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WeeklySlate } from "./types";
import { buildWeeklySummary } from "./analysis";

export function useWeeklySlate() {
  const [slate, setSlate] = useState<WeeklySlate | null>(null);
  const [week, setWeek] = useState<number | null>(null);
  const [year] = useState(() => new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlate = useCallback(async (weekParam: number | null, yearParam: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ year: String(yearParam) });
      if (weekParam !== null) params.set("week", String(weekParam));
      const res = await fetch(`/api/cfb?${params.toString()}`);
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      const json: { slate: WeeklySlate } = await res.json();
      setSlate(json.slate);
      setWeek(json.slate.week);
    } catch {
      setError("Couldn't reach the live scoreboard — showing sample data instead.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetching the current week's slate once on mount — not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSlate(null, year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToWeek = useCallback(
    (nextWeek: number) => {
      if (nextWeek < 1) return;
      fetchSlate(nextWeek, year);
    },
    [fetchSlate, year]
  );

  const refresh = useCallback(() => {
    fetchSlate(week, year);
  }, [fetchSlate, week, year]);

  const summary = useMemo(() => (slate ? buildWeeklySummary(slate) : null), [slate]);

  return { slate, summary, week, loading, error, goToWeek, refresh };
}
