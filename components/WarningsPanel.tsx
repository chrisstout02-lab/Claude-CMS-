import type { OverlapWarning } from "@/lib/types";

const SEVERITY_META: Record<OverlapWarning["severity"], { label: string; color: string; icon: string }> = {
  critical: { label: "Critical", color: "var(--status-critical)", icon: "●" },
  serious: { label: "Serious", color: "var(--status-serious)", icon: "▲" },
  warning: { label: "Watch", color: "var(--status-warning)", icon: "■" },
};

const KIND_LABEL: Record<OverlapWarning["kind"], string> = {
  "etf-holding-overlap": "ETF overlap",
  "sector-concentration": "Sector concentration",
  "single-position": "Position size",
  "industry-cluster": "Industry cluster",
};

export default function WarningsPanel({ warnings }: { warnings: OverlapWarning[] }) {
  if (warnings.length === 0) {
    return (
      <div
        className="rounded-lg border p-4 text-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-secondary)" }}
      >
        <span style={{ color: "var(--status-good)" }}>●</span> No concentration or overlap issues detected at current
        thresholds. Add more holdings or refresh fundamentals for a fuller picture.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {warnings.map((w) => {
        const meta = SEVERITY_META[w.severity];
        return (
          <li
            key={w.id}
            className="rounded-lg border p-3"
            style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: meta.color }} aria-hidden>
                {meta.icon}
              </span>
              <span className="text-xs font-medium" style={{ color: meta.color }}>
                {meta.label}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                · {KIND_LABEL[w.kind]}
              </span>
            </div>
            <div className="mt-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {w.title}
            </div>
            <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {w.description}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
