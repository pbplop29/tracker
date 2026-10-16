"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BodyWeightDto } from "@/lib/types";
import { deltaColor } from "@/components/weight/delta";

function shortDate(dateKey: string) {
  const [, month, day] = dateKey.split("-").map(Number);
  return new Date(2000, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function WeightChart({ data }: { data: BodyWeightDto[] }) {
  const rows = useMemo(
    () =>
      data.map((p, i) => ({
        label: shortDate(p.date),
        weight: p.weight,
        // Change vs the previous reading; drives the segment and dot colour.
        delta: i === 0 ? 0 : Math.round((p.weight - data[i - 1].weight) * 10) / 10,
      })),
    [data]
  );

  // Hard-stop gradient so each segment is green (lost) or red (gained). Points
  // are evenly spaced on the category axis, so segment i spans i/(n-1)..(i+1)/(n-1).
  // A perfectly flat line has zero-height bounds, which SVG gradients can't paint,
  // so fall back to a plain stroke in that case.
  const useGradient = rows.length > 1 && rows.some((r) => r.delta !== 0);
  const stops = rows.slice(1).flatMap((r, i) => {
    const color = deltaColor(r.delta);
    const from = (i / (rows.length - 1)) * 100;
    const to = ((i + 1) / (rows.length - 1)) * 100;
    return [
      <stop key={`a${i}`} offset={`${from}%`} stopColor={color} />,
      <stop key={`b${i}`} offset={`${to}%`} stopColor={color} />,
    ];
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="weight-line" x1="0" y1="0" x2="1" y2="0">
              {stops}
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
            minTickGap={24}
          />
          <YAxis
            domain={[(min: number) => Math.floor(min - 1), (max: number) => Math.ceil(max + 1)]}
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
            formatter={(value) => [`${value} kg`, "Weight"]}
          />
          <Line
            type="linear"
            dataKey="weight"
            stroke={useGradient ? "url(#weight-line)" : "var(--color-muted-foreground)"}
            strokeWidth={2.5}
            dot={(props) => {
              const { cx, cy, index, payload } = props as { cx: number; cy: number; index: number; payload: { delta: number } };
              return <circle key={index} cx={cx} cy={cy} r={3.5} fill={deltaColor(payload.delta)} />;
            }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
