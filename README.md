# Portfolio Dashboard

A dashboard for understanding a Robinhood stock portfolio: allocation by
company, sector, and market-cap size; key fundamentals (margins, revenue,
P/E) per holding; and detection of redundant or overlapping positions
(e.g. holding an S&P 500 ETF alongside the individual mega-caps it already
contains, or several stocks clustered in the same industry).

This app also includes a [**College Football Outlook**](#college-football-outlook)
page at `/cfb` with a weekly summary of upcoming FBS matchups.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Load sample
portfolio** to see the dashboard populated immediately, or import your own
holdings.

## Importing your holdings

Two CSV formats are supported (auto-detected):

1. **Positions export** — columns like `Symbol`/`Ticker`, `Quantity`/`Shares`,
   and optionally `Average Cost`. See `public/sample-portfolio.csv` for an
   example.
2. **Robinhood activity/statement export** — columns including `Instrument`,
   `Trans Code` (`Buy`/`Sell`), `Quantity`, `Price`. Buys and sells are
   netted per ticker into current positions with a weighted-average cost
   basis from the buy transactions.

You can also add or edit positions manually in the table below the import
controls. Everything is stored only in `localStorage` in your browser —
holdings are never sent anywhere except to request fundamentals for the
tickers you hold.

## Fundamentals data

`app/api/fundamentals/route.ts` tries to fetch live fundamentals (price,
market cap, margins, revenue, P/E, sector/industry) from a public quote
provider for each ticker you hold. If that fails — no network access, an
unrecognized ticker, or the provider is unreachable — it falls back to a
small static reference dataset in `lib/fallbackFundamentals.ts` covering
~70 common tickers and ETFs. Rows using fallback data are labeled
"static ref." in the holdings table; treat those numbers as illustrative,
not current, and refresh once the app is deployed somewhere with outbound
internet access. To extend coverage, add entries to
`lib/fallbackFundamentals.ts` or wire in a paid provider (e.g. Financial
Modeling Prep, Alpha Vantage) in the route handler.

## What the dashboard shows

- **Stat tiles** — total value, gain/loss, a diversification score, and
  your largest single position.
- **Allocation by holding** — a donut chart of the top 7 positions by
  value plus an "Other" bucket.
- **Allocation by sector** and **by company size** (Mega/Large/Mid/Small/
  Micro market-cap buckets) — bar breakdowns to spot skew.
- **Redundancy & concentration** — flags for:
  - ETF holdings whose top constituents overlap with stocks you also hold
    directly (e.g. VOO + AAPL + MSFT + NVDA).
  - A single sector or position making up an outsized share of the
    portfolio.
  - Three or more holdings clustered in the same industry, which tend to
    move together.
- **Holdings & fundamentals table** — sortable, with weight, market value,
  gain/loss, market cap, P/E, gross/profit margin, TTM revenue, and YoY
  revenue growth per holding.

## Notes

- Market-cap buckets: Mega ≥ $200B, Large $10–200B, Mid $2–10B, Small
  $300M–2B, Micro < $300M.
- The diversification score is `100 × (1 − HHI / 10000)` using the
  Herfindahl-Hirschman Index of position weights — higher is more spread
  out.
- ETF overlap detection uses an approximate, hand-maintained list of each
  ETF's largest constituents (`topHoldings` in
  `lib/fallbackFundamentals.ts`), not a live holdings feed — treat it as
  directional, not exhaustive.

## College Football Outlook

Open [http://localhost:3000/cfb](http://localhost:3000/cfb) (or use the nav
bar) for a weekly summary of the upcoming FBS slate: kickoff times, AP/CFP
rankings, records, spreads, over/unders, and moneylines, plus a "games worth
watching" panel.

- **Live data**: `app/api/cfb/route.ts` fetches the current week's scoreboard
  and odds from ESPN's public API. If that's unreachable — no network access,
  or ESPN changes/rate-limits the endpoint — it falls back to a small,
  clearly-labeled sample slate in `lib/cfb/sampleWeek.ts` so the UI still
  works. Responses are cached for 5 minutes.
- **"Games worth watching"**: `lib/cfb/analysis.ts` computes a simple,
  transparent power rating from each team's rank and win/loss record, then
  compares the gap between the two teams to the posted spread. Games where
  that gap is unusually large are flagged as a possible market mismatch
  (favorite or underdog), and any game between two ranked teams is flagged as
  a marquee matchup. **This is a talking-point heuristic, not a predictive
  model or betting advice** — it doesn't know about injuries, weather, line
  movement, or anything not already public in the rank/record/spread.
- **Responsible use**: the page includes a persistent disclaimer. Sports
  betting is illegal in some jurisdictions and age-restricted where legal —
  check local laws. If you or someone you know needs help, the National
  Problem Gambling Helpline (1-800-GAMBLER) is free and confidential.
- To use a real odds provider (e.g. The Odds API) instead of/alongside ESPN,
  extend `app/api/cfb/route.ts` — the `WeeklySlate`/`CfbGame` shapes in
  `lib/cfb/types.ts` are provider-agnostic.
