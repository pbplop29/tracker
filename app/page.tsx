"use client";

import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import { Dumbbell } from "lucide-react";
import { ExerciseCard } from "@/components/home/exercise-card";
import { useWorkoutStore } from "@/lib/store/workout-store";
import { jsonFetcher } from "@/lib/api";
import type { WorkoutDayDto } from "@/lib/types";

export default function HomePage() {
  const selectedDate = useWorkoutStore((s) => s.selectedDate);
  const { data, isLoading } = useSWR<WorkoutDayDto>(`/api/workout?date=${selectedDate}`, jsonFetcher);

  return (
    <div className="px-4 pt-4">
      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && data && data.exercises.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
            <Dumbbell className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No exercises yet</p>
            <p className="text-sm text-muted-foreground">Tap the + button to log your first set.</p>
          </div>
        </div>
      )}

      {!isLoading && data && data.exercises.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {data.exercises.map((exercise) => (
              <motion.div
                key={exercise.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.22 }}
              >
                <ExerciseCard exercise={exercise} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
