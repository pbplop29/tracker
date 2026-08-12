"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useSWR, { useSWRConfig } from "swr";
import { Minus, Plus, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ExerciseCombobox } from "@/components/add-exercise/exercise-combobox";
import { SetWheelRow } from "@/components/add-exercise/set-wheel-row";
import { useWorkoutStore } from "@/lib/store/workout-store";
import { createWorkoutExercise, updateWorkoutExercise, jsonFetcher } from "@/lib/api";
import { formatDisplayDate, isToday } from "@/lib/date";
import type { PreviousWorkoutDto } from "@/lib/types";
import { toast } from "sonner";

const formSchema = z.object({
  exerciseName: z.string().trim().min(1, "Name your exercise"),
  sets: z
    .array(
      z.object({
        weight: z.number().min(0).max(2000),
        reps: z.number().int().min(0).max(500),
      })
    )
    .min(1),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULT_SET_COUNT = 3;
const MIN_SETS = 1;
const MAX_SETS = 10;
const EMPTY_SET = { weight: 0, reps: 0 };

export function AddExerciseSheet() {
  const isOpen = useWorkoutStore((s) => s.isAddSheetOpen);
  const editing = useWorkoutStore((s) => s.editingExercise);
  const selectedDate = useWorkoutStore((s) => s.selectedDate);
  const closeAddSheet = useWorkoutStore((s) => s.closeAddSheet);
  const { mutate } = useSWRConfig();
  const [submitting, setSubmitting] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const isEditing = Boolean(editing);

  const { control, handleSubmit, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { exerciseName: "", sets: Array.from({ length: DEFAULT_SET_COUNT }, () => EMPTY_SET) },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "sets" });
  const exerciseName = watch("exerciseName");
  const sets = watch("sets");

  const seededForKey = useRef<string | null>(null);

  // Reset the form whenever the sheet opens, seeding it from the exercise
  // being edited (if any) so the wheels start on real values, not zero.
  useEffect(() => {
    if (!isOpen) return;
    seededForKey.current = null;
    setExpandedIndex(0);
    if (editing) {
      replace(editing.sets.map((s) => ({ weight: s.weight, reps: s.reps })));
      setValue("exerciseName", editing.name);
    } else {
      replace(Array.from({ length: DEFAULT_SET_COUNT }, () => EMPTY_SET));
      setValue("exerciseName", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editing]);

  const previousKey =
    exerciseName.trim().length > 1
      ? `/api/exercises/previous?name=${encodeURIComponent(exerciseName.trim())}&beforeDate=${selectedDate}${
          editing ? `&excludeId=${editing.id}` : ""
        }`
      : null;
  const { data: previous } = useSWR<PreviousWorkoutDto | null>(previousKey, jsonFetcher);

  // Seed every set's wheel with last time's weight/reps for this exercise, so
  // logging "the same as last time" takes zero taps. Only runs once per
  // exercise (guarded by previousKey), so it never clobbers a value the user
  // has already scrolled to.
  useEffect(() => {
    if (isEditing || !previous || !previousKey) return;
    if (seededForKey.current === previousKey) return;
    seededForKey.current = previousKey;
    previous.sets.forEach((s, i) => {
      if (i < fields.length) {
        setValue(`sets.${i}.weight`, s.weight);
        setValue(`sets.${i}.reps`, s.reps);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previous, previousKey, isEditing]);

  const dateLabel = isToday(selectedDate) ? "today" : formatDisplayDate(selectedDate);

  const setCount = fields.length;
  const addSet = () => {
    if (setCount >= MAX_SETS) return;
    const fromPrevious = previous?.sets[setCount];
    const fallback = sets[setCount - 1] ?? EMPTY_SET;
    append(fromPrevious ? { weight: fromPrevious.weight, reps: fromPrevious.reps } : fallback);
    setExpandedIndex(setCount);
  };
  const removeSet = () => {
    if (setCount <= MIN_SETS) return;
    remove(setCount - 1);
    setExpandedIndex((i) => (i !== null && i >= setCount - 1 ? setCount - 2 : i));
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateWorkoutExercise(editing.id, { exerciseName: values.exerciseName, sets: values.sets });
        toast.success(`${values.exerciseName} updated`);
      } else {
        await createWorkoutExercise({ date: selectedDate, exerciseName: values.exerciseName, sets: values.sets });
        toast.success(`${values.exerciseName} added`);
      }
      await mutate(`/api/workout?date=${selectedDate}`);
      await mutate((key) => typeof key === "string" && key.startsWith("/api/contributions"));
      closeAddSheet();
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && closeAddSheet()} showSwipeHandle>
      <DrawerContent className="mx-auto w-full sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle className="text-lg">
            {isEditing ? "Edit exercise" : "Add exercise"}
          </DrawerTitle>
          <p className="text-sm text-muted-foreground">
            {isEditing ? "Update sets for" : "Logging for"} {dateLabel}
          </p>
        </DrawerHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <div className="space-y-1.5">
              <Label>Exercise</Label>
              <Controller
                control={control}
                name="exerciseName"
                render={({ field }) => (
                  <ExerciseCombobox value={field.value} onChange={field.onChange} autoFocus={!isEditing} />
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Sets</Label>
              <div className="flex items-center gap-3 rounded-full border border-border bg-secondary/50 px-1 py-1">
                <button
                  type="button"
                  onClick={removeSet}
                  disabled={setCount <= MIN_SETS}
                  className="flex size-8 items-center justify-center rounded-full bg-background text-foreground shadow-sm disabled:opacity-30"
                  aria-label="Remove set"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-5 text-center text-sm font-semibold tabular-nums">{setCount}</span>
                <button
                  type="button"
                  onClick={addSet}
                  disabled={setCount >= MAX_SETS}
                  className="flex size-8 items-center justify-center rounded-full bg-background text-foreground shadow-sm disabled:opacity-30"
                  aria-label="Add set"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => (
                <SetWheelRow
                  key={field.id}
                  index={index}
                  weight={sets[index]?.weight ?? 0}
                  reps={sets[index]?.reps ?? 0}
                  onChangeWeight={(v) => setValue(`sets.${index}.weight`, v)}
                  onChangeReps={(v) => setValue(`sets.${index}.reps`, v)}
                  expanded={expandedIndex === index}
                  onToggle={() => setExpandedIndex((i) => (i === index ? null : index))}
                />
              ))}
            </div>

            {previous && (
              <p className="rounded-xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                Previous ({formatDisplayDate(previous.date)}):{" "}
                {previous.sets.map((s) => `${s.weight}×${s.reps}`).join(", ")}
              </p>
            )}
          </div>

          <DrawerFooter>
            <Button type="submit" size="lg" className="h-12 rounded-xl text-base" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEditing ? "Save changes" : "Add exercise"}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
