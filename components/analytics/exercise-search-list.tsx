"use client";

import { Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ExerciseSummaryDto } from "@/lib/types";

interface Props {
  exercises: ExerciseSummaryDto[];
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (exercise: ExerciseSummaryDto) => void;
}

export function ExerciseSearchList({ exercises, query, onQueryChange, onSelect }: Props) {
  const filtered = exercises.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search exercises"
          className="h-12 rounded-xl pl-9 text-base"
        />
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {exercises.length === 0 ? "Log a workout to see progress here." : "No exercises match your search."}
        </p>
      )}

      <div className="space-y-1.5">
        {filtered.map((exercise) => (
          <button
            key={exercise.id}
            onClick={() => onSelect(exercise)}
            className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3.5 text-left active:bg-accent"
          >
            <span className="font-medium">{exercise.name}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}
