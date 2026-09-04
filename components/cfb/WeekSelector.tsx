export default function WeekSelector({
  week,
  onChange,
  disabled,
}: {
  week: number;
  onChange: (week: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => onChange(week - 1)}
        disabled={disabled || week <= 1}
        className="rounded border px-2 py-1 disabled:opacity-40"
        style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
      >
        ← Prev
      </button>
      <span className="px-1 font-medium" style={{ color: "var(--text-primary)" }}>
        Week {week}
      </span>
      <button
        type="button"
        onClick={() => onChange(week + 1)}
        disabled={disabled}
        className="rounded border px-2 py-1 disabled:opacity-40"
        style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
      >
        Next →
      </button>
    </div>
  );
}
