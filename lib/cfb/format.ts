export function formatSpread(spread: number | null, favorite: "home" | "away" | null, homeAbbr: string, awayAbbr: string): string {
  if (spread === null) return "—";
  const abs = Math.abs(spread);
  const favoredTeam = favorite === "away" ? awayAbbr : homeAbbr;
  return `${favoredTeam} -${abs}`;
}

export function formatMoneyline(value: number | null): string {
  if (value === null) return "—";
  return value > 0 ? `+${value}` : `${value}`;
}

export function formatKickoff(iso: string, fallback: string): string {
  if (!iso) return fallback || "—";
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(date);
  } catch {
    return fallback || "—";
  }
}
