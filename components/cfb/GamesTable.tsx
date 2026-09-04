import type { CfbGame } from "@/lib/cfb/types";
import { formatKickoff, formatMoneyline, formatSpread } from "@/lib/cfb/format";

function teamCell(name: string, rank: number | null, record: string) {
  return (
    <div>
      <div className="font-medium" style={{ color: "var(--text-primary)" }}>
        {rank && (
          <span className="mr-1" style={{ color: "var(--text-muted)" }}>
            #{rank}
          </span>
        )}
        {name}
      </div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {record}
      </div>
    </div>
  );
}

export default function GamesTable({ games }: { games: CfbGame[] }) {
  if (games.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        No games scheduled for this week.
      </div>
    );
  }

  const sorted = [...games].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Kickoff", "Away", "Home", "Spread", "O/U", "Moneyline", "TV"].map((label) => (
              <th key={label} className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((game) => (
            <tr key={game.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <td className="whitespace-nowrap px-3 py-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                {game.completed ? "Final" : formatKickoff(game.startDate, game.statusDetail)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {teamCell(game.away.shortName, game.away.rank, `${game.away.wins}-${game.away.losses}`)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {teamCell(game.home.shortName, game.home.rank, `${game.home.wins}-${game.home.losses}`)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                {game.odds ? formatSpread(game.odds.spread, game.odds.favorite, game.home.abbreviation, game.away.abbreviation) : "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-2 tabular-nums">{game.odds?.overUnder ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-2 tabular-nums text-xs" style={{ color: "var(--text-muted)" }}>
                {game.odds ? `${formatMoneyline(game.odds.awayMoneyline)} / ${formatMoneyline(game.odds.homeMoneyline)}` : "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
                {game.broadcast ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
