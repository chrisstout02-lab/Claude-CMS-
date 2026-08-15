"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Fundamentals, Holding } from "./types";
import { parseHoldingsCsv } from "./csv";
import { enrichHoldings } from "./analytics";
import { computeAnalytics } from "./analytics";

const STORAGE_KEY = "robinhood-dashboard-holdings-v1";

function loadStoredHoldings(): Holding[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function usePortfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [fundamentals, setFundamentals] = useState<Map<string, Fundamentals>>(new Map());
  const [loadingFundamentals, setLoadingFundamentals] = useState(false);
  const [csvWarnings, setCsvWarnings] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    // Reading localStorage (a browser-only external system) after mount, once — not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHoldings(loadStoredHoldings());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  }, [holdings, hydrated]);

  const fetchFundamentals = useCallback(async (tickers: string[]) => {
    const missing = tickers.filter((t) => t);
    if (missing.length === 0) return;
    setLoadingFundamentals(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/fundamentals?tickers=${encodeURIComponent(missing.join(","))}`);
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      const json: { fundamentals: Record<string, Fundamentals> } = await res.json();
      setFundamentals((prev) => {
        const next = new Map(prev);
        for (const [ticker, data] of Object.entries(json.fundamentals)) {
          next.set(ticker, data);
        }
        return next;
      });
    } catch {
      setFetchError("Couldn't reach the fundamentals service — showing static reference data where available.");
    } finally {
      setLoadingFundamentals(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const tickersNeeded = holdings.map((h) => h.ticker).filter((t) => !fundamentals.has(t));
    if (tickersNeeded.length > 0) {
      // Syncing with the fundamentals API whenever new tickers appear.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchFundamentals(tickersNeeded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings, hydrated]);

  const addHolding = useCallback((holding: Holding) => {
    setHoldings((prev) => {
      const existingIndex = prev.findIndex((h) => h.ticker === holding.ticker);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = holding;
        return next;
      }
      return [...prev, holding];
    });
  }, []);

  const removeHolding = useCallback((ticker: string) => {
    setHoldings((prev) => prev.filter((h) => h.ticker !== ticker));
  }, []);

  const updateHolding = useCallback((ticker: string, patch: Partial<Holding>) => {
    setHoldings((prev) => prev.map((h) => (h.ticker === ticker ? { ...h, ...patch } : h)));
  }, []);

  const clearHoldings = useCallback(() => {
    setHoldings([]);
    setCsvWarnings([]);
  }, []);

  const importCsv = useCallback((text: string) => {
    const { holdings: parsed, warnings } = parseHoldingsCsv(text);
    setCsvWarnings(warnings);
    if (parsed.length > 0) {
      setHoldings((prev) => {
        const byTicker = new Map(prev.map((h) => [h.ticker, h]));
        for (const h of parsed) byTicker.set(h.ticker, h);
        return Array.from(byTicker.values());
      });
    }
    return { count: parsed.length, warnings };
  }, []);

  const refreshFundamentals = useCallback(() => {
    fetchFundamentals(holdings.map((h) => h.ticker));
  }, [fetchFundamentals, holdings]);

  const enrichedHoldings = useMemo(() => enrichHoldings(holdings, fundamentals), [holdings, fundamentals]);
  const analytics = useMemo(() => computeAnalytics(enrichedHoldings), [enrichedHoldings]);

  return {
    hydrated,
    holdings,
    enrichedHoldings,
    analytics,
    addHolding,
    removeHolding,
    updateHolding,
    clearHoldings,
    importCsv,
    csvWarnings,
    loadingFundamentals,
    fetchError,
    refreshFundamentals,
  };
}
