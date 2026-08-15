"use client";

import { useRef, useState } from "react";
import type { Holding } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface Props {
  holdings: Holding[];
  csvWarnings: string[];
  onImportCsv: (text: string) => { count: number; warnings: string[] };
  onAdd: (holding: Holding) => void;
  onRemove: (ticker: string) => void;
  onUpdate: (ticker: string, patch: Partial<Holding>) => void;
  onClear: () => void;
  onLoadSample: () => void;
}

export default function HoldingsPanel({
  holdings,
  csvWarnings,
  onImportCsv,
  onAdd,
  onRemove,
  onUpdate,
  onClear,
  onLoadSample,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [manualTicker, setManualTicker] = useState("");
  const [manualShares, setManualShares] = useState("");
  const [manualCost, setManualCost] = useState("");
  const [importedCount, setImportedCount] = useState<number | null>(null);

  async function handleFile(file: File) {
    const text = await file.text();
    const { count } = onImportCsv(text);
    setImportedCount(count);
  }

  function handleManualAdd(e: React.FormEvent) {
    e.preventDefault();
    const ticker = manualTicker.trim().toUpperCase();
    const shares = Number(manualShares);
    if (!ticker || !Number.isFinite(shares) || shares <= 0) return;
    const avgCost = manualCost.trim() === "" ? null : Number(manualCost);
    onAdd({ ticker, shares, avgCost: Number.isFinite(avgCost) ? avgCost : null });
    setManualTicker("");
    setManualShares("");
    setManualCost("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
      >
        <div>
          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Import your holdings
          </div>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            Upload a Robinhood positions or activity CSV export, or add positions manually below.
          </p>
          {importedCount !== null && (
            <p className="mt-1 text-xs" style={{ color: "var(--success-text)" }}>
              Imported {importedCount} position{importedCount === 1 ? "" : "s"}.
            </p>
          )}
          {csvWarnings.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-xs" style={{ color: "var(--status-serious)" }}>
              {csvWarnings.slice(0, 4).map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
            style={{ background: "var(--series-1)" }}
          >
            Upload CSV
          </button>
          <button
            type="button"
            onClick={onLoadSample}
            className="rounded-md border px-3 py-1.5 text-sm font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            Load sample portfolio
          </button>
          {holdings.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-md border px-3 py-1.5 text-sm font-medium"
              style={{ borderColor: "var(--border)", color: "var(--status-critical)" }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <form
        onSubmit={handleManualAdd}
        className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: "var(--text-muted)" }}>
            Ticker
          </label>
          <input
            value={manualTicker}
            onChange={(e) => setManualTicker(e.target.value)}
            placeholder="AAPL"
            className="w-24 rounded-md border px-2 py-1 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-primary)" }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: "var(--text-muted)" }}>
            Shares
          </label>
          <input
            value={manualShares}
            onChange={(e) => setManualShares(e.target.value)}
            placeholder="10"
            inputMode="decimal"
            className="w-24 rounded-md border px-2 py-1 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-primary)" }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: "var(--text-muted)" }}>
            Avg cost (optional)
          </label>
          <input
            value={manualCost}
            onChange={(e) => setManualCost(e.target.value)}
            placeholder="150.00"
            inputMode="decimal"
            className="w-28 rounded-md border px-2 py-1 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-primary)" }}
          />
        </div>
        <button
          type="submit"
          className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
          style={{ background: "var(--series-3)" }}
        >
          Add position
        </button>
      </form>

      {holdings.length > 0 && (
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Ticker
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Shares
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Avg cost
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Cost basis
                </th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h.ticker} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-3 py-1.5 font-medium" style={{ color: "var(--text-primary)" }}>
                    {h.ticker}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <input
                      type="number"
                      value={h.shares}
                      onChange={(e) => onUpdate(h.ticker, { shares: Number(e.target.value) })}
                      className="w-20 rounded border px-1.5 py-0.5 text-right tabular-nums"
                      style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-primary)" }}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <input
                      type="number"
                      value={h.avgCost ?? ""}
                      onChange={(e) =>
                        onUpdate(h.ticker, { avgCost: e.target.value === "" ? null : Number(e.target.value) })
                      }
                      placeholder="—"
                      className="w-24 rounded border px-1.5 py-0.5 text-right tabular-nums"
                      style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-primary)" }}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>
                    {h.avgCost !== null ? formatCurrency(h.avgCost * h.shares) : "—"}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => onRemove(h.ticker)}
                      className="text-xs"
                      style={{ color: "var(--status-critical)" }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
