"use client";

import { usePortfolio } from "@/lib/usePortfolio";
import { SAMPLE_PORTFOLIO } from "@/lib/samplePortfolio";
import HoldingsPanel from "./HoldingsPanel";
import StatTiles from "./StatTiles";
import AllocationChart from "./AllocationChart";
import BarBreakdown from "./BarBreakdown";
import MetricsTable from "./MetricsTable";
import WarningsPanel from "./WarningsPanel";

export default function Dashboard() {
  const {
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
  } = usePortfolio();

  const sectorItems = analytics.sectorSlices.map((s) => ({
    label: s.sector,
    value: s.value,
    weight: s.weight,
    tickers: s.tickers,
  }));
  const bucketItems = analytics.bucketSlices.map((b) => ({
    label: b.bucket,
    value: b.value,
    weight: b.weight,
    tickers: b.tickers,
  }));

  function handleLoadSample() {
    for (const h of SAMPLE_PORTFOLIO) addHolding(h);
  }

  if (!hydrated) {
    return <div className="p-8 text-sm" style={{ color: "var(--text-muted)" }}>Loading…</div>;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Portfolio dashboard
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Import your Robinhood holdings to see company size, margins, revenue, and where your positions overlap.
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>Holdings are stored only in this browser (localStorage) — nothing is uploaded to a server.</span>
          {holdings.length > 0 && (
            <button
              type="button"
              onClick={refreshFundamentals}
              disabled={loadingFundamentals}
              className="underline disabled:opacity-50"
            >
              {loadingFundamentals ? "Refreshing…" : "Refresh fundamentals"}
            </button>
          )}
        </div>
        {fetchError && (
          <p className="mt-1 text-xs" style={{ color: "var(--status-serious)" }}>
            {fetchError}
          </p>
        )}
      </header>

      <HoldingsPanel
        holdings={holdings}
        csvWarnings={csvWarnings}
        onImportCsv={importCsv}
        onAdd={addHolding}
        onRemove={removeHolding}
        onUpdate={updateHolding}
        onClear={clearHoldings}
        onLoadSample={handleLoadSample}
      />

      {holdings.length > 0 && (
        <>
          <StatTiles analytics={analytics} />

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
              <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Allocation by holding
              </h2>
              <AllocationChart holdings={enrichedHoldings} />
            </section>

            <section className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
              <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Allocation by sector
              </h2>
              <BarBreakdown items={sectorItems} />
            </section>

            <section className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
              <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Allocation by company size
              </h2>
              <BarBreakdown items={bucketItems} />
              <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                Mega ≥ $200B · Large $10–200B · Mid $2–10B · Small $300M–2B · Micro &lt; $300M. ETFs are excluded (no
                single market cap).
              </p>
            </section>

            <section className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
              <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Redundancy &amp; concentration
              </h2>
              <WarningsPanel warnings={analytics.warnings} />
            </section>
          </div>

          <section>
            <h2 className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Holdings &amp; fundamentals
            </h2>
            <MetricsTable holdings={enrichedHoldings} />
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              &ldquo;static ref.&rdquo; rows use approximate offline reference data (live fundamentals are unavailable in this
              environment or for that ticker) — refresh once deployed somewhere with outbound network access, or edit{" "}
              <code>lib/fallbackFundamentals.ts</code> with current figures.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
