"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { WheelPicker, WHEEL_HEIGHT } from "@/components/add-exercise/wheel-picker";

interface SetWheelRowProps {
  index: number;
  weight: number;
  reps: number;
  onChangeWeight: (value: number) => void;
  onChangeReps: (value: number) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function SetWheelRow({
  index,
  weight,
  reps,
  onChangeWeight,
  onChangeReps,
  expanded,
  onToggle,
}: SetWheelRowProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3.5 active:bg-accent"
      >
        <span className="text-sm font-medium text-muted-foreground">Set {index + 1}</span>
        <span className="flex items-center gap-2">
          <span className="text-base font-semibold tabular-nums">
            {weight} kg <span className="text-muted-foreground">×</span> {reps}
          </span>
          <ChevronDown
            className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-180")}
          />
        </span>
      </button>

      {expanded && (
        <div className="relative border-t border-border/60 px-2 pb-2">
          <div
            className="pointer-events-none absolute inset-x-2 top-1/2 rounded-xl bg-secondary"
            style={{ height: 40, transform: "translateY(-50%)" }}
          />
          <div className="relative grid grid-cols-2" style={{ height: WHEEL_HEIGHT }}>
            <WheelPicker value={weight} onChange={onChangeWeight} min={0} max={300} step={0.5} decimals={1} suffix="kg" />
            <WheelPicker value={reps} onChange={onChangeReps} min={0} max={100} step={1} suffix="reps" />
          </div>
        </div>
      )}
    </div>
  );
}
