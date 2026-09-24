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
  sparkline: number[];
};

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

function Sparkline({ values }: { values: number[] }) {
  const w = 84;
  const h = 30;

  if (values.length < 2) {
    return <svg width={w} height={h} className="flex-shrink-0" />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - 2 - ((v - min) / range) * (h - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const up = values[values.length - 1] >= values[0];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={up ? "#157A4A" : "#C0362C"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Row({ row }: { row: Row }) {
  return (
    <Link
      href={`/theses/${row.id}`}
      className="flex items-center gap-4 border-b border-rule py-4 hover:bg-ink/[0.02]"
    >
      <div className="w-24 flex-shrink-0 sm:w-28">
        <p className="font-data text-sm font-medium">{row.ticker}</p>
        <p className="text-xs text-muted">
          Long · {row.status === "open" ? "Open" : row.status.replace("closed_", "")}
        </p>
        <p className="text-xs text-muted">{fmtDate(row.entryDate)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium">{row.companyName}</h3>
        <p className="mt-0.5 truncate text-sm text-muted">{row.writeUp}</p>
        <p className="font-data mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
          <span className="text-muted">
            ${row.entryPrice.toFixed(2)} → ${row.latestPrice.toFixed(2)}
          </span>
          <span className={toneClass(row.rawReturn)}>Return {formatPct(row.rawReturn)}</span>
          <span className={toneClass(row.alphaVsSector)}>
            Alpha vs sector {formatPct(row.alphaVsSector)}
          </span>
          <span className={toneClass(row.alphaVsSp500)}>
            Alpha vs S&amp;P {formatPct(row.alphaVsSp500)}
          </span>
          <span className="text-muted">Held {heldFor(row.entryDate, row.exitDate)}</span>
        </p>
      </div>
      <div className="hidden sm:block">
        <Sparkline values={row.sparkline} />
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
    <section className="mt-4">
      <div className="flex gap-5 pt-8 text-sm">
        {(["all", "open", "closed"] as const).map((f) => {
          const count = f === "all" ? rows.length : f === "open" ? openRows.length : closedRows.length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                filter === f
                  ? "border-b-2 border-ink pb-2 font-medium"
                  : "border-b-2 border-transparent pb-2 text-muted hover:text-ink"
              }
            >
              {f === "all" ? "All" : f === "open" ? "Open" : "Closed"} ({count})
            </button>
          );
        })}
      </div>

      <div className="-mt-px">
        {visible.map((row) => (
          <Row key={row.id} row={row} />
        ))}
      </div>
    </section>
  );
}
