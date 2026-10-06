"use client";

import { useState } from "react";
import Link from "next/link";

type Row = {
  id: number;
  ticker: string;
  companyName: string;
  entryDate: string;
  exitDate: string | null;
  status: string;
  writeUp: string;
  entryPrice: number;
  latestPrice: number;
  rawReturn: number;
  alphaVsSector: number | null;
  alphaVsSp500: number | null;
  sectorReturn: number | null;
  sp500Return: number | null;
  sparkline: number[];
};

// Shared by the header row and each position row so columns always line up.
const COLUMNS =
  "lg:grid lg:grid-cols-[minmax(0,2.5fr)_1.2fr_0.8fr_0.8fr_0.8fr_0.5fr_88px] lg:items-center lg:gap-x-4";

function formatPct(n: number | null) {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function toneClass(n: number | null) {
  if (n == null) return "text-muted";
  return n >= 0 ? "text-gain" : "text-loss";
}

function heldFor(entryDate: string, exitDate: string | null) {
  const start = new Date(entryDate);
  const end = exitDate ? new Date(exitDate) : new Date();
  const days = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
  if (days < 31) return `${days}d`;
  const months = Math.round(days / 30.4);
  return `${months}mo`;
}

// entryDate is a plain calendar date with no time component ("2026-09-22"),
// which JS parses as UTC midnight - but toLocaleDateString formats in the
// *viewer's* local timezone by default, so anyone west of UTC would see it
// silently shift back a day. Pinning timeZone: "UTC" makes the displayed
// date always match the stored one, everywhere.
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function statusLabel(status: string) {
  return status === "open" ? "Open" : `Closed, ${status.replace("closed_", "")}`;
}

function Sparkline({ values, index }: { values: number[]; index: number }) {
  const w = 88;
  const h = 28;

  if (values.length < 2) {
    return <svg width={w} height={h} className="flex-shrink-0" aria-hidden />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const coords = values.map((v, i) => [
    (i / (values.length - 1)) * (w - 4) + 2,
    h - 3 - ((v - min) / range) * (h - 6),
  ]);
  const points = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const up = values[values.length - 1] >= values[0];
  const stroke = up ? "var(--color-gain)" : "var(--color-loss)";
  const [lx, ly] = coords[coords.length - 1];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-shrink-0" aria-hidden>
      <polyline
        points={points}
        pathLength={1}
        className="spark-line"
        style={{ ["--i" as string]: index }}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r="2.25" fill={stroke} />
    </svg>
  );
}

function Delta({ value }: { value: number | null }) {
  const glyph = value == null || value === 0 ? "" : value > 0 ? "▲" : "▼";
  return (
    <span className={`inline-flex items-baseline gap-1 ${toneClass(value)}`}>
      {glyph && (
        <span aria-hidden className="text-[8px] leading-none">
          {glyph}
        </span>
      )}
      {formatPct(value)}
    </span>
  );
}

// On mobile each metric shows its own label; from md up the column header row
// above the list carries the labels instead.
function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 lg:justify-end">
      <span className="label text-muted lg:hidden">{label}</span>
      <span className="font-data text-sm lg:text-right">{children}</span>
    </div>
  );
}

function Row({ row, index }: { row: Row; index: number }) {
  return (
    <Link
      href={`/theses/${row.id}`}
      style={{ ["--i" as string]: index + 3 }}
      className={`rise group relative block border-b border-rule py-5 transition-colors hover:bg-surface ${COLUMNS}`}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-0.5 origin-top scale-y-0 bg-brass transition-transform duration-200 group-hover:scale-y-100"
      />

      <div className="min-w-0 pl-3">
        <div className="flex items-baseline gap-2.5">
          <span className="font-data flex-shrink-0 rounded-sm border border-ink/25 px-1.5 py-0.5 text-[11px] font-medium tracking-wide">
            {row.ticker}
          </span>
          <h3 className="truncate font-medium">{row.companyName}</h3>
        </div>
        <p className="mt-1.5 truncate text-sm text-muted">{row.writeUp}</p>
        <p className="label mt-2 text-muted">
          Long · {statusLabel(row.status)} · {fmtDate(row.entryDate)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-y-1.5 pl-3 sm:grid-cols-2 sm:gap-x-8 lg:contents">
        <Metric label="Entry → last">
          <span className="text-muted">${row.entryPrice.toFixed(2)}</span>
          <span className="mx-1 text-muted/60">→</span>
          <span>${row.latestPrice.toFixed(2)}</span>
        </Metric>
        <Metric label="Return">
          <span className="font-medium">
            <Delta value={row.rawReturn} />
          </span>
        </Metric>
        <Metric label="Sector">
          <Delta value={row.sectorReturn} />
        </Metric>
        <Metric label="S&P 500">
          <Delta value={row.sp500Return} />
        </Metric>
        <Metric label="Held">
          <span className="text-muted">{heldFor(row.entryDate, row.exitDate)}</span>
        </Metric>
      </div>

      <div className="hidden justify-self-end lg:block">
        <Sparkline values={row.sparkline} index={index + 3} />
      </div>
    </Link>
  );
}

export function ThesisList({ rows }: { rows: Row[] }) {
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

  const openRows = rows.filter((r) => r.status === "open");
  const closedRows = rows.filter((r) => r.status !== "open");
  const visible = filter === "all" ? rows : filter === "open" ? openRows : closedRows;

  if (rows.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-serif text-2xl font-medium tracking-tight">Positions</h2>
        <div role="tablist" aria-label="Filter positions" className="flex gap-1.5">
          {(["all", "open", "closed"] as const).map((f) => {
            const count =
              f === "all" ? rows.length : f === "open" ? openRows.length : closedRows.length;
            const active = filter === f;
            return (
              <button
                key={f}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f)}
                className={`label rounded-sm border px-3 py-1.5 transition-colors ${
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-rule text-muted hover:border-ink/40 hover:text-ink"
                }`}
              >
                {f} <span className="font-data ml-1 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={`label mt-5 hidden border-y border-ink/80 py-2.5 text-muted ${COLUMNS}`}
        aria-hidden
      >
        <span className="pl-3">Position</span>
        <span className="text-right">Entry → last</span>
        <span className="text-right">Return</span>
        <span className="text-right">Sector</span>
        <span className="text-right">S&amp;P 500</span>
        <span className="text-right">Held</span>
        <span className="text-right">Trend</span>
      </div>

      <div className="mt-5 border-t border-ink/80 lg:mt-0 lg:border-t-0">
        {visible.map((row, i) => (
          <Row key={row.id} row={row} index={i} />
        ))}
      </div>
    </section>
  );
}
