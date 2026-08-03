"use client";

import { cn } from "@/lib/utils";

export type Metric = "weight" | "reps" | "volume";

const METRICS: { value: Metric; label: string }[] = [
  { value: "weight", label: "Weight" },
  { value: "reps", label: "Reps" },
  { value: "volume", label: "Volume" },
];

export function MetricTabs({ value, onChange }: { value: Metric; onChange: (m: Metric) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary/60 p-1">
      {METRICS.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={cn(
            "rounded-lg py-2 text-sm font-medium transition-colors",
            value === m.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground active:text-foreground"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
