import Papa from "papaparse";
import type { Holding } from "./types";

export interface ParseResult {
  holdings: Holding[];
  warnings: string[];
}

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findColumn(row: Record<string, string>, candidates: string[]): string | null {
  const normalizedRow: Record<string, string> = {};
  for (const key of Object.keys(row)) {
    normalizedRow[normalizeKey(key)] = key;
  }
  for (const candidate of candidates) {
    const normalized = normalizeKey(candidate);
    if (normalized in normalizedRow) return normalizedRow[normalized];
  }
  return null;
}

function toNumber(raw: string | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  const cleaned = raw.replace(/[$,()]/g, "").replace(/\s/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === "--") return null;
  const isNegParen = /\(.*\)/.test(raw);
  const n = Number(cleaned);
  if (Number.isNaN(n)) return null;
  return isNegParen ? -Math.abs(n) : n;
}

/**
 * Parses either:
 * 1. A simple positions export (Symbol/Ticker, Quantity/Shares, Average Cost)
 * 2. A Robinhood account-activity export (Instrument, Trans Code Buy/Sell, Quantity, Price),
 *    which is aggregated into net positions with a weighted-average cost basis.
 */
export function parseHoldingsCsv(text: string): ParseResult {
  const warnings: string[] = [];
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    for (const err of result.errors.slice(0, 5)) {
      warnings.push(`Row ${err.row ?? "?"}: ${err.message}`);
    }
  }

  const rows = result.data.filter((r) => Object.keys(r).length > 0);
  if (rows.length === 0) {
    return { holdings: [], warnings: ["No rows found in file."] };
  }

  const firstRow = rows[0];
  const transCodeCol = findColumn(firstRow, ["Trans Code", "TransCode", "Transaction Code"]);
  const instrumentCol = findColumn(firstRow, ["Instrument", "Symbol", "Ticker"]);
  const priceCol = findColumn(firstRow, ["Price"]);
  const quantityCol = findColumn(firstRow, ["Quantity", "Qty", "Shares"]);

  if (transCodeCol && instrumentCol && quantityCol) {
    return parseActivityFormat(rows, { transCodeCol, instrumentCol, priceCol, quantityCol }, warnings);
  }

  const symbolCol = findColumn(firstRow, ["Symbol", "Ticker", "Instrument"]);
  const sharesCol = findColumn(firstRow, ["Quantity", "Shares", "Qty"]);
  const avgCostCol = findColumn(firstRow, [
    "Average Cost",
    "Avg Cost",
    "Average Cost Basis",
    "Cost Basis Per Share",
    "Avg Price",
  ]);

  if (symbolCol && sharesCol) {
    return parsePositionsFormat(rows, { symbolCol, sharesCol, avgCostCol }, warnings);
  }

  warnings.push(
    "Could not detect a recognizable column layout. Expected either (Symbol, Quantity, Average Cost) or a Robinhood activity export (Instrument, Trans Code, Quantity, Price)."
  );
  return { holdings: [], warnings };
}

function parsePositionsFormat(
  rows: Record<string, string>[],
  cols: { symbolCol: string; sharesCol: string; avgCostCol: string | null },
  warnings: string[]
): ParseResult {
  const holdings: Holding[] = [];
  for (const row of rows) {
    const ticker = (row[cols.symbolCol] || "").trim().toUpperCase();
    if (!ticker) continue;
    const shares = toNumber(row[cols.sharesCol]);
    if (shares === null || shares <= 0) {
      warnings.push(`Skipped "${ticker}": missing or invalid share quantity.`);
      continue;
    }
    const avgCost = cols.avgCostCol ? toNumber(row[cols.avgCostCol]) : null;
    holdings.push({ ticker, shares, avgCost });
  }
  return { holdings: mergeDuplicates(holdings), warnings };
}

function parseActivityFormat(
  rows: Record<string, string>[],
  cols: { transCodeCol: string; instrumentCol: string; priceCol: string | null; quantityCol: string },
  warnings: string[]
): ParseResult {
  interface Accum {
    shares: number;
    buyShares: number;
    buyCost: number;
  }
  const byTicker = new Map<string, Accum>();

  for (const row of rows) {
    const ticker = (row[cols.instrumentCol] || "").trim().toUpperCase();
    const code = (row[cols.transCodeCol] || "").trim().toUpperCase();
    if (!ticker) continue;
    const quantity = toNumber(row[cols.quantityCol]);
    const price = cols.priceCol ? toNumber(row[cols.priceCol]) : null;
    if (quantity === null) continue;

    if (!byTicker.has(ticker)) byTicker.set(ticker, { shares: 0, buyShares: 0, buyCost: 0 });
    const accum = byTicker.get(ticker)!;

    if (code === "BUY" || code === "BTO" || code === "BTC") {
      accum.shares += quantity;
      accum.buyShares += quantity;
      if (price !== null) accum.buyCost += quantity * price;
    } else if (code === "SELL" || code === "STC" || code === "STO") {
      accum.shares -= quantity;
    }
    // Non-trade rows (dividends, interest, transfers) are ignored for share counts.
  }

  const holdings: Holding[] = [];
  for (const [ticker, accum] of byTicker.entries()) {
    const shares = Math.round(accum.shares * 1e6) / 1e6;
    if (shares <= 0.000001) continue;
    const avgCost = accum.buyShares > 0 ? accum.buyCost / accum.buyShares : null;
    holdings.push({ ticker, shares, avgCost });
  }

  if (holdings.length === 0) {
    warnings.push("No open positions could be derived from the activity export (all shares may have been sold).");
  }

  return { holdings, warnings };
}

function mergeDuplicates(holdings: Holding[]): Holding[] {
  const byTicker = new Map<string, { shares: number; costTotal: number; costKnownShares: number }>();
  for (const h of holdings) {
    if (!byTicker.has(h.ticker)) byTicker.set(h.ticker, { shares: 0, costTotal: 0, costKnownShares: 0 });
    const accum = byTicker.get(h.ticker)!;
    accum.shares += h.shares;
    if (h.avgCost !== null) {
      accum.costTotal += h.avgCost * h.shares;
      accum.costKnownShares += h.shares;
    }
  }
  return Array.from(byTicker.entries()).map(([ticker, accum]) => ({
    ticker,
    shares: accum.shares,
    avgCost: accum.costKnownShares > 0 ? accum.costTotal / accum.costKnownShares : null,
  }));
}
