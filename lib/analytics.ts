import type {
  BucketSlice,
  EnrichedHolding,
  Fundamentals,
  Holding,
  MarketCapBucket,
  OverlapWarning,
  PortfolioAnalytics,
  SectorSlice,
} from "./types";

export function marketCapBucket(marketCap: number | null): MarketCapBucket | null {
  if (marketCap === null) return null;
  if (marketCap >= 200e9) return "Mega";
  if (marketCap >= 10e9) return "Large";
  if (marketCap >= 2e9) return "Mid";
  if (marketCap >= 300e6) return "Small";
  return "Micro";
}

export function enrichHoldings(
  holdings: Holding[],
  fundamentalsByTicker: Map<string, Fundamentals>
): EnrichedHolding[] {
  const withValue = holdings.map((h) => {
    const fundamentals = fundamentalsByTicker.get(h.ticker) ?? null;
    const price = fundamentals?.price ?? null;
    const marketValue = price !== null ? h.shares * price : h.avgCost !== null ? h.shares * h.avgCost : null;
    const costBasis = h.avgCost !== null ? h.shares * h.avgCost : null;
    const gainLoss = marketValue !== null && costBasis !== null ? marketValue - costBasis : null;
    const gainLossPct = gainLoss !== null && costBasis && costBasis !== 0 ? gainLoss / costBasis : null;
    return {
      ticker: h.ticker,
      shares: h.shares,
      avgCost: h.avgCost,
      costBasis,
      fundamentals,
      marketValue,
      gainLoss,
      gainLossPct,
      marketCapBucket: marketCapBucket(fundamentals?.marketCap ?? null),
      weight: null as number | null,
    };
  });

  const totalValue = withValue.reduce((sum, h) => sum + (h.marketValue ?? 0), 0);
  return withValue.map((h) => ({
    ...h,
    weight: totalValue > 0 && h.marketValue !== null ? h.marketValue / totalValue : null,
  }));
}

function buildSectorSlices(holdings: EnrichedHolding[], totalValue: number): SectorSlice[] {
  const bySector = new Map<string, { value: number; tickers: string[] }>();
  for (const h of holdings) {
    const sector = h.fundamentals?.sector ?? "Unknown";
    if (!bySector.has(sector)) bySector.set(sector, { value: 0, tickers: [] });
    const entry = bySector.get(sector)!;
    entry.value += h.marketValue ?? 0;
    entry.tickers.push(h.ticker);
  }
  return Array.from(bySector.entries())
    .map(([sector, { value, tickers }]) => ({
      sector,
      value,
      weight: totalValue > 0 ? value / totalValue : 0,
      tickers,
    }))
    .sort((a, b) => b.value - a.value);
}

function buildBucketSlices(holdings: EnrichedHolding[], totalValue: number): BucketSlice[] {
  const order: MarketCapBucket[] = ["Mega", "Large", "Mid", "Small", "Micro"];
  const byBucket = new Map<MarketCapBucket, { value: number; tickers: string[] }>();
  for (const h of holdings) {
    if (h.fundamentals?.assetType === "ETF") continue;
    const bucket = h.marketCapBucket;
    if (!bucket) continue;
    if (!byBucket.has(bucket)) byBucket.set(bucket, { value: 0, tickers: [] });
    const entry = byBucket.get(bucket)!;
    entry.value += h.marketValue ?? 0;
    entry.tickers.push(h.ticker);
  }
  return order
    .filter((b) => byBucket.has(b))
    .map((bucket) => {
      const { value, tickers } = byBucket.get(bucket)!;
      return { bucket, value, weight: totalValue > 0 ? value / totalValue : 0, tickers };
    });
}

function computeHHI(weights: number[]): number {
  // Standard HHI on a 0-10000 scale (weights expressed as percent, squared and summed).
  return weights.reduce((sum, w) => sum + Math.pow(w * 100, 2), 0);
}

function buildWarnings(holdings: EnrichedHolding[], sectorSlices: SectorSlice[]): OverlapWarning[] {
  const warnings: OverlapWarning[] = [];
  const equityHoldings = holdings.filter((h) => h.fundamentals?.assetType !== "ETF");
  const etfHoldings = holdings.filter((h) => h.fundamentals?.assetType === "ETF");
  const equityTickers = new Set(equityHoldings.map((h) => h.ticker));

  // 1. ETF vs individual-stock overlap.
  for (const etf of etfHoldings) {
    const topHoldings = etf.fundamentals?.topHoldings ?? [];
    const overlapping = topHoldings.filter((t) => equityTickers.has(t));
    if (overlapping.length > 0) {
      const overlapWeight = holdings
        .filter((h) => overlapping.includes(h.ticker))
        .reduce((sum, h) => sum + (h.weight ?? 0), 0);
      warnings.push({
        id: `etf-overlap-${etf.ticker}`,
        kind: "etf-holding-overlap",
        severity: overlapWeight > 0.25 ? "serious" : "warning",
        title: `${etf.ticker} overlaps with ${overlapping.length} individual holding${overlapping.length > 1 ? "s" : ""}`,
        description: `${etf.ticker} (${(etf.weight ?? 0) * 100 < 0.1 ? "<0.1" : ((etf.weight ?? 0) * 100).toFixed(1)}% of portfolio) already holds meaningful positions in ${overlapping.join(", ")}. Owning both the ETF and these stocks directly compounds your exposure rather than diversifying it — combined weight in these names is ~${(overlapWeight * 100).toFixed(1)}% of the portfolio.`,
        tickers: [etf.ticker, ...overlapping],
      });
    }
  }

  // 2. Sector concentration.
  for (const slice of sectorSlices) {
    if (slice.sector === "Unknown") continue;
    if (slice.weight >= 0.55) {
      warnings.push({
        id: `sector-${slice.sector}`,
        kind: "sector-concentration",
        severity: "critical",
        title: `${slice.sector} is ${(slice.weight * 100).toFixed(0)}% of your portfolio`,
        description: `${slice.tickers.join(", ")} together make up over half your portfolio value. A downturn specific to ${slice.sector} would hit the whole account hard.`,
        tickers: slice.tickers,
      });
    } else if (slice.weight >= 0.4) {
      warnings.push({
        id: `sector-${slice.sector}`,
        kind: "sector-concentration",
        severity: "serious",
        title: `${slice.sector} is ${(slice.weight * 100).toFixed(0)}% of your portfolio`,
        description: `${slice.tickers.join(", ")} are concentrated in a single sector. Consider whether this weighting is intentional or a byproduct of buying similar companies over time.`,
        tickers: slice.tickers,
      });
    } else if (slice.weight >= 0.3) {
      warnings.push({
        id: `sector-${slice.sector}`,
        kind: "sector-concentration",
        severity: "warning",
        title: `${slice.sector} is ${(slice.weight * 100).toFixed(0)}% of your portfolio`,
        description: `${slice.tickers.join(", ")} give you meaningful concentration in ${slice.sector}. Worth keeping an eye on relative to your target allocation.`,
        tickers: slice.tickers,
      });
    }
  }

  // 3. Single-position concentration.
  for (const h of holdings) {
    if (!h.weight) continue;
    if (h.weight >= 0.3) {
      warnings.push({
        id: `position-${h.ticker}`,
        kind: "single-position",
        severity: "critical",
        title: `${h.ticker} is ${(h.weight * 100).toFixed(0)}% of your portfolio`,
        description: `A single holding this large means your account's performance is closely tied to one company's outcome.`,
        tickers: [h.ticker],
      });
    } else if (h.weight >= 0.2) {
      warnings.push({
        id: `position-${h.ticker}`,
        kind: "single-position",
        severity: "warning",
        title: `${h.ticker} is ${(h.weight * 100).toFixed(0)}% of your portfolio`,
        description: `This is a large single-stock weighting relative to a typical diversified target of 5-10% per position.`,
        tickers: [h.ticker],
      });
    }
  }

  // 4. Industry clusters (potential redundant/overlapping picks within equities).
  const byIndustry = new Map<string, EnrichedHolding[]>();
  for (const h of equityHoldings) {
    const industry = h.fundamentals?.industry;
    if (!industry) continue;
    if (!byIndustry.has(industry)) byIndustry.set(industry, []);
    byIndustry.get(industry)!.push(h);
  }
  for (const [industry, group] of byIndustry.entries()) {
    if (group.length < 3) continue;
    const weight = group.reduce((sum, h) => sum + (h.weight ?? 0), 0);
    warnings.push({
      id: `industry-${industry}`,
      kind: "industry-cluster",
      severity: weight >= 0.25 ? "serious" : "warning",
      title: `${group.length} holdings in ${industry}`,
      description: `${group.map((h) => h.ticker).join(", ")} are all classified under ${industry} (~${(weight * 100).toFixed(1)}% of the portfolio). These companies tend to move together, so owning several may add redundancy rather than diversification.`,
      tickers: group.map((h) => h.ticker),
    });
  }

  const severityRank = { critical: 0, serious: 1, warning: 2 };
  return warnings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

export function computeAnalytics(holdings: EnrichedHolding[]): PortfolioAnalytics {
  const totalValue = holdings.reduce((sum, h) => sum + (h.marketValue ?? 0), 0);
  const totalCostBasis = holdings.reduce((sum, h) => sum + (h.costBasis ?? 0), 0);
  const totalGainLoss = totalValue - totalCostBasis;
  const totalGainLossPct = totalCostBasis > 0 ? totalGainLoss / totalCostBasis : 0;

  const sectorSlices = buildSectorSlices(holdings, totalValue);
  const bucketSlices = buildBucketSlices(holdings, totalValue);

  const sectorHHI = computeHHI(sectorSlices.map((s) => s.weight));
  const positionHHI = computeHHI(holdings.map((h) => h.weight ?? 0));
  const diversificationScore = Math.max(0, Math.min(100, 100 * (1 - positionHHI / 10000)));

  const warnings = buildWarnings(holdings, sectorSlices);

  const topPosition = holdings
    .filter((h) => h.weight !== null)
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))[0];

  return {
    totalValue,
    totalCostBasis,
    totalGainLoss,
    totalGainLossPct,
    positionCount: holdings.length,
    sectorSlices,
    bucketSlices,
    sectorHHI,
    positionHHI,
    diversificationScore,
    warnings,
    topPosition: topPosition ? { ticker: topPosition.ticker, weight: topPosition.weight ?? 0 } : null,
  };
}
