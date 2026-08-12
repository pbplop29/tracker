"use client";

import { useEffect, useRef, useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import { Trash2, Check } from "lucide-react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { deleteWorkoutExercise } from "@/lib/api";
import { useWorkoutStore } from "@/lib/store/workout-store";
import type { WorkoutExerciseDto } from "@/lib/types";

const REVEAL_WIDTH = 84;
const CONFIRM_TIMEOUT_MS = 3000;

export function ExerciseCard({ exercise }: { exercise: WorkoutExerciseDto }) {
  const [revealed, setRevealed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { mutate } = useSWRConfig();
  const selectedDate = useWorkoutStore((s) => s.selectedDate);
  const openAddSheet = useWorkoutStore((s) => s.openAddSheet);

  useEffect(() => {
    return () => {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
    };
  }, []);

  const resetDeleteState = () => {
    if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
    setConfirming(false);
    setRevealed(false);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -REVEAL_WIDTH / 2 || info.velocity.x < -400) {
      setRevealed(true);
    } else {
      resetDeleteState();
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

  const handleDeleteButtonClick = () => {
    if (!confirming) {
      setConfirming(true);
      confirmTimeout.current = setTimeout(() => setConfirming(false), CONFIRM_TIMEOUT_MS);
      return;
    }
    if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
    handleDelete();
  };

  const handleTap = () => {
    if (revealed) {
      resetDeleteState();
      return;
    }
    openAddSheet(exercise);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-y-0 right-0 flex" style={{ width: REVEAL_WIDTH }}>
        <button
          onClick={handleDeleteButtonClick}
          disabled={deleting}
          aria-label={confirming ? `Confirm delete ${exercise.name}` : `Delete ${exercise.name}`}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-1 text-destructive-foreground transition-colors disabled:opacity-60",
            confirming ? "bg-destructive/80" : "bg-destructive"
          )}
        >
          {confirming ? <Check className="size-5" /> : <Trash2 className="size-5" />}
          <span className="text-[11px] font-medium">{confirming ? "Confirm?" : "Delete"}</span>
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
