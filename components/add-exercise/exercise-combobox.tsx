"use client";

import { useState } from "react";
import useSWR from "swr";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { jsonFetcher } from "@/lib/api";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import type { ExerciseSummaryDto } from "@/lib/types";

interface ExerciseComboboxProps {
  value: string;
  onChange: (name: string) => void;
  autoFocus?: boolean;
}

export function ExerciseCombobox({ value, onChange, autoFocus }: ExerciseComboboxProps) {
  const [open, setOpen] = useState(false);
  const debounced = useDebouncedValue(value, 200);

  const { data: suggestions } = useSWR<ExerciseSummaryDto[]>(
    `/api/exercises?q=${encodeURIComponent(debounced)}`,
    jsonFetcher
  );

  const filtered = (suggestions ?? []).filter(
    (s) => s.name.toLowerCase() !== value.trim().toLowerCase()
  );

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus={autoFocus}
          value={value}
          placeholder="Search or type a new exercise"
          className="h-12 rounded-xl pl-9 text-base"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        />
      </div>

      {open && value.trim().length > 0 && filtered.length > 0 && (
        <div className="absolute z-50 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-lg">
          {filtered.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(exercise.name);
                setOpen(false);
              }}
              className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm active:bg-accent"
            >
              {exercise.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
