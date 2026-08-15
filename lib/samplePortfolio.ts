import type { Holding } from "./types";

// A deliberately redundant sample portfolio: broad-market + tech ETFs stacked
// on top of the mega-cap tech names they already hold, plus a cluster of
// regional banks — useful for demonstrating the overlap/concentration checks.
export const SAMPLE_PORTFOLIO: Holding[] = [
  { ticker: "AAPL", shares: 20, avgCost: 195 },
  { ticker: "MSFT", shares: 10, avgCost: 410 },
  { ticker: "GOOGL", shares: 15, avgCost: 165 },
  { ticker: "NVDA", shares: 30, avgCost: 120 },
  { ticker: "AMZN", shares: 15, avgCost: 190 },
  { ticker: "TSLA", shares: 10, avgCost: 220 },
  { ticker: "VOO", shares: 10, avgCost: 480 },
  { ticker: "QQQ", shares: 8, avgCost: 430 },
  { ticker: "JPM", shares: 15, avgCost: 200 },
  { ticker: "BAC", shares: 50, avgCost: 38 },
  { ticker: "WFC", shares: 30, avgCost: 60 },
];
