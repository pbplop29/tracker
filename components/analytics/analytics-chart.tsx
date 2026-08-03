"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsPointDto } from "@/lib/types";
import type { Metric } from "@/components/analytics/metric-tabs";

const SET_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function formatShortDate(dateKey: string) {
  const [, month, day] = dateKey.split("-").map(Number);
  return new Date(2000, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function valueFor(metric: Metric, weight: number, reps: number) {
  if (metric === "weight") return weight;
  if (metric === "reps") return reps;
  return Math.round(weight * reps * 10) / 10;
}

export function AnalyticsChart({ data, metric }: { data: AnalyticsPointDto[]; metric: Metric }) {
  const { rows, setNumbers } = useMemo(() => {
    const maxSets = data.reduce((max, point) => Math.max(max, point.sets.length), 0);
    const setNumbers = Array.from({ length: maxSets }, (_, i) => i + 1);

    const rows = data.map((point) => {
      const row: Record<string, number | string> = { date: point.date, label: formatShortDate(point.date) };
      for (const set of point.sets) {
        row[`set${set.setNumber}`] = valueFor(metric, set.weight, set.reps);
      }
      return row;
    });

    return { rows, setNumbers };
  }, [data, metric]);

  const unit = metric === "weight" ? " kg" : metric === "reps" ? " reps" : " kg·reps";

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={38}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--color-foreground)", fontWeight: 600, marginBottom: 4 }}
            formatter={(value, name) => [`${value}${unit}`, String(name).replace("set", "Set ")]}
          />
          {setNumbers.map((setNumber, idx) => (
            <Line
              key={setNumber}
              type="monotone"
              dataKey={`set${setNumber}`}
              name={`set${setNumber}`}
              stroke={SET_COLORS[idx % SET_COLORS.length]}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
