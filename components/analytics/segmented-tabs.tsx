"use client";

import { cn } from "@/lib/utils";

interface SegmentedTabsProps<T extends string> {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedTabs<T extends string>({ tabs, value, onChange }: SegmentedTabsProps<T>) {
  return (
    <div role="tablist" className="grid gap-1 rounded-xl bg-secondary/60 p-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "rounded-lg py-2 text-sm font-medium transition-colors",
            value === t.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground active:text-foreground"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
