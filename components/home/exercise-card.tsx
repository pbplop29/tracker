"use client";

import { useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { deleteWorkoutExercise } from "@/lib/api";
import { useWorkoutStore } from "@/lib/store/workout-store";
import type { WorkoutExerciseDto } from "@/lib/types";

const REVEAL_WIDTH = 84;

export function ExerciseCard({ exercise }: { exercise: WorkoutExerciseDto }) {
  const [revealed, setRevealed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { mutate } = useSWRConfig();
  const selectedDate = useWorkoutStore((s) => s.selectedDate);
  const openAddSheet = useWorkoutStore((s) => s.openAddSheet);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -REVEAL_WIDTH / 2 || info.velocity.x < -400) {
      setRevealed(true);
    } else {
      setRevealed(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteWorkoutExercise(exercise.id);
      await mutate(`/api/workout?date=${selectedDate}`);
      await mutate((key) => typeof key === "string" && key.startsWith("/api/contributions"));
      toast.success(`${exercise.name} removed`);
    } catch {
      toast.error("Couldn't delete that exercise.");
      setDeleting(false);
    }
  };

  const handleTap = () => {
    if (revealed) {
      setRevealed(false);
      return;
    }
    openAddSheet(exercise);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-y-0 right-0 flex" style={{ width: REVEAL_WIDTH }}>
        <button
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`Delete ${exercise.name}`}
          className="flex w-full flex-col items-center justify-center gap-1 bg-destructive text-destructive-foreground disabled:opacity-60"
        >
          <Trash2 className="size-5" />
          <span className="text-[11px] font-medium">Delete</span>
        </button>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -REVEAL_WIDTH, right: 0 }}
        dragElastic={0.03}
        dragMomentum={false}
        animate={{ x: revealed ? -REVEAL_WIDTH : 0, opacity: deleting ? 0.5 : 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 42 }}
        onDragEnd={handleDragEnd}
        onClick={handleTap}
        className="relative z-10 cursor-pointer rounded-2xl border border-border/60 bg-card p-4 shadow-sm active:shadow-none"
      >
        <h3 className="mb-2.5 text-[15px] font-semibold">{exercise.name}</h3>
        <div className="space-y-1.5">
          {exercise.sets.map((set) => (
            <div
              key={set.id}
              className="flex items-center justify-between text-sm text-muted-foreground"
            >
              <span>Set {set.setNumber}</span>
              <span className="font-medium text-foreground tabular-nums">
                {set.weight} kg × {set.reps}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
