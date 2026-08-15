import { NextRequest, NextResponse } from "next/server";
import type { Fundamentals } from "@/lib/types";
import { getFallbackFundamentals } from "@/lib/fallbackFundamentals";

export const dynamic = "force-dynamic";

interface CacheEntry {
  data: Fundamentals;
  expiresAt: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

const YAHOO_MODULES = "assetProfile,summaryDetail,defaultKeyStatistics,financialData,price,quoteType";

async function fetchLiveFundamentals(ticker: string): Promise<Fundamentals | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
      ticker
    )}?modules=${YAHOO_MODULES}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PortfolioDashboard/1.0)" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.quoteSummary?.result?.[0];
    if (!result) return null;

    const price = result.price ?? {};
    const summaryDetail = result.summaryDetail ?? {};
    const financialData = result.financialData ?? {};
    const assetProfile = result.assetProfile ?? {};
    const quoteType = result.quoteType?.quoteType ?? price.quoteType;

    const raw = (v: unknown): number | null => {
      if (v && typeof v === "object" && "raw" in (v as Record<string, unknown>)) {
        const n = (v as { raw?: number }).raw;
        return typeof n === "number" ? n : null;
      }
      return typeof v === "number" ? v : null;
    };

    const isETF = quoteType === "ETF";

    const fundamentals: Fundamentals = {
      ticker: ticker.toUpperCase(),
      name: price.longName || price.shortName || ticker.toUpperCase(),
      sector: assetProfile.sector || (isETF ? "Diversified" : "Unknown"),
      industry: assetProfile.industry || (isETF ? "ETF" : "Unknown"),
      assetType: isETF ? "ETF" : "Equity",
      price: raw(price.regularMarketPrice),
      marketCap: raw(price.marketCap),
      peRatio: raw(summaryDetail.trailingPE),
      grossMargin: raw(financialData.grossMargins),
      operatingMargin: raw(financialData.operatingMargins),
      profitMargin: raw(financialData.profitMargins),
      revenueTTM: raw(financialData.totalRevenue),
      revenueGrowthYoY: raw(financialData.revenueGrowth),
      dividendYield: raw(summaryDetail.dividendYield),
      beta: raw(summaryDetail.beta),
      source: "live",
      asOf: new Date().toISOString(),
    };

    if (!fundamentals.price) return null;
    return fundamentals;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveFundamentals(ticker: string): Promise<Fundamentals> {
  const upper = ticker.toUpperCase();
  const cached = cache.get(upper);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const live = await fetchLiveFundamentals(upper);
  const data =
    live ??
    getFallbackFundamentals(upper) ?? {
      ticker: upper,
      name: upper,
      sector: "Unknown",
      industry: "Unknown",
      assetType: "Equity",
      price: null,
      marketCap: null,
      peRatio: null,
      grossMargin: null,
      operatingMargin: null,
      profitMargin: null,
      revenueTTM: null,
      revenueGrowthYoY: null,
      dividendYield: null,
      beta: null,
      source: "unknown",
    };

  cache.set(upper, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

export async function GET(request: NextRequest) {
  const tickersParam = request.nextUrl.searchParams.get("tickers") ?? "";
  const tickers = Array.from(
    new Set(
      tickersParam
        .split(",")
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean)
    )
  ).slice(0, 100);

  if (tickers.length === 0) {
    return NextResponse.json({ fundamentals: {} });
  }

  const results = await Promise.all(tickers.map((t) => resolveFundamentals(t)));
  const fundamentals: Record<string, Fundamentals> = {};
  results.forEach((f, i) => {
    fundamentals[tickers[i]] = f;
  });

  return NextResponse.json({ fundamentals });
}
