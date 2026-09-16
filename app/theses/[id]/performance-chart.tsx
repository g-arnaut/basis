"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { IndexedPoint } from "@/lib/performance";

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
      <div className="flex h-64 items-center justify-center border border-dashed border-rule text-sm text-muted">
        Chart appears once the daily cron logs a price beyond entry day.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#E5E5E5" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E5E5" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "#FAFAFA",
              border: "1px solid #E5E5E5",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
            }}
            formatter={(value) => `${Number(value).toFixed(1)}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="stock"
            name={tickerLabel}
            stroke="#111113"
            strokeWidth={2}
            dot={false}
          />
          {sectorLabel && (
            <Line
              type="monotone"
              dataKey="sectorEtf"
              name={sectorLabel}
              stroke="#15803D"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 3"
            />
          )}
          <Line
            type="monotone"
            dataKey="sp500"
            name="S&P 500"
            stroke="#6B7280"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 3"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
