export interface Holding {
  ticker: string;
  shares: number;
  avgCost: number | null;
}

export type MarketCapBucket = "Mega" | "Large" | "Mid" | "Small" | "Micro";

export type AssetType = "Equity" | "ETF";

export type FundamentalsSource = "live" | "fallback" | "manual" | "unknown";

export interface Fundamentals {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  assetType: AssetType;
  price: number | null;
  marketCap: number | null;
  peRatio: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  profitMargin: number | null;
  revenueTTM: number | null;
  revenueGrowthYoY: number | null;
  dividendYield: number | null;
  beta: number | null;
  /** Only present for ETFs: approximate top constituent tickers, for overlap detection. */
  topHoldings?: string[];
  source: FundamentalsSource;
  asOf?: string;
}

export interface EnrichedHolding {
  ticker: string;
  shares: number;
  avgCost: number | null;
  costBasis: number | null;
  fundamentals: Fundamentals | null;
  marketValue: number | null;
  weight: number | null;
  gainLoss: number | null;
  gainLossPct: number | null;
  marketCapBucket: MarketCapBucket | null;
}

export interface SectorSlice {
  sector: string;
  value: number;
  weight: number;
  tickers: string[];
}

export interface BucketSlice {
  bucket: MarketCapBucket;
  value: number;
  weight: number;
  tickers: string[];
}

export interface OverlapWarning {
  id: string;
  kind: "etf-holding-overlap" | "sector-concentration" | "single-position" | "industry-cluster";
  severity: "warning" | "serious" | "critical";
  title: string;
  description: string;
  tickers: string[];
}

export interface PortfolioAnalytics {
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPct: number;
  positionCount: number;
  sectorSlices: SectorSlice[];
  bucketSlices: BucketSlice[];
  sectorHHI: number;
  positionHHI: number;
  diversificationScore: number;
  warnings: OverlapWarning[];
  topPosition: { ticker: string; weight: number } | null;
}
