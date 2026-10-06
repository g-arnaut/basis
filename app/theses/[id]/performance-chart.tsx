"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { IndexedPoint } from "@/lib/performance";

const INK = "#08120d";
const FOREST = "#0d3b2a";
const BRASS = "#52615a";
const MUTED = "#52615a";
const RULE = "#c9d2cb";

// Dates are plain calendar dates ("2026-09-22"); format in UTC so the tick
// label never shifts a day for viewers west of UTC.
function fmtTick(d: string) {
  return new Date(`${String(d).slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function PerformanceChart({
  data,
  tickerLabel,
  sectorLabel,
}: {
  data: IndexedPoint[];
  tickerLabel: string;
  sectorLabel: string | null;
}) {
  if (data.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center border border-dashed border-rule bg-surface px-6 text-center text-sm text-muted">
        The chart appears once the daily job has logged a price beyond the entry day.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 30, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={RULE} strokeDasharray="2 5" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmtTick}
            tick={{ fontSize: 11, fill: MUTED, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={{ stroke: RULE }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: MUTED, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
            tickFormatter={(v) => Number(v).toFixed(0)}
          />
          <ReferenceLine y={100} stroke={INK} strokeOpacity={0.35} />
          <Tooltip
            cursor={{ stroke: INK, strokeOpacity: 0.25 }}
            contentStyle={{
              background: "#ffffff",
              border: `1px solid ${RULE}`,
              borderRadius: 2,
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              boxShadow: "0 6px 18px rgba(15,26,21,0.08)",
            }}
            labelFormatter={(d) => fmtTick(String(d))}
            formatter={(value) => Number(value).toFixed(1)}
          />
          <Legend
            iconType="plainline"
            wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-mono)", paddingTop: 8 }}
          />
          <Line
            type="monotone"
            dataKey="stock"
            name={tickerLabel}
            stroke={INK}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 3.5 }}
            animationDuration={900}
          />
          {sectorLabel && (
            <Line
              type="monotone"
              dataKey="sectorEtf"
              name={sectorLabel}
              stroke={FOREST}
              strokeWidth={2}
              dot={false}
              strokeDasharray="6 4"
              animationDuration={900}
            />
          )}
          <Line
            type="monotone"
            dataKey="sp500"
            name="S&P 500"
            stroke={BRASS}
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="5 3"
            animationDuration={900}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
