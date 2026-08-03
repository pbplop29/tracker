"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExerciseCombobox } from "@/components/add-exercise/exercise-combobox";
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
        weight: z.union([z.string(), z.number()]),
        reps: z.union([z.string(), z.number()]),
      })
    )
    .min(1),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULT_SET_COUNT = 3;
const MIN_SETS = 1;
const MAX_SETS = 10;

export function AddExerciseSheet() {
  const isOpen = useWorkoutStore((s) => s.isAddSheetOpen);
  const editing = useWorkoutStore((s) => s.editingExercise);
  const selectedDate = useWorkoutStore((s) => s.selectedDate);
  const closeAddSheet = useWorkoutStore((s) => s.closeAddSheet);
  const { mutate } = useSWRConfig();
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(editing);

  const { control, register, handleSubmit, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { exerciseName: "", sets: Array.from({ length: DEFAULT_SET_COUNT }, () => ({ weight: "", reps: "" })) },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "sets" });
  const exerciseName = watch("exerciseName");

  // Reset the form whenever the sheet opens, seeding it from the exercise
  // being edited (if any) so weight/reps show real values, not placeholders.
  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      replace(editing.sets.map((s) => ({ weight: s.weight, reps: s.reps })));
      setValue("exerciseName", editing.name);
    } else {
      replace(Array.from({ length: DEFAULT_SET_COUNT }, () => ({ weight: "", reps: "" })));
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

  const dateLabel = isToday(selectedDate) ? "today" : formatDisplayDate(selectedDate);

  const setCount = fields.length;
  const addSet = () => setCount < MAX_SETS && append({ weight: "", reps: "" });
  const removeSet = () => setCount > MIN_SETS && remove(setCount - 1);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const sets = values.sets.map((s) => ({
        weight: typeof s.weight === "string" ? parseFloat(s.weight || "0") : s.weight,
        reps: typeof s.reps === "string" ? parseInt(s.reps || "0", 10) : s.reps,
      }));

      if (editing) {
        await updateWorkoutExercise(editing.id, { exerciseName: values.exerciseName, sets });
        toast.success(`${values.exerciseName} updated`);
      } else {
        await createWorkoutExercise({ date: selectedDate, exerciseName: values.exerciseName, sets });
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

            <div className="space-y-2.5">
              <div className="grid grid-cols-[2rem_1fr_1fr] gap-2 px-1 text-xs font-medium text-muted-foreground">
                <span />
                <span>Weight (kg)</span>
                <span>Reps</span>
              </div>
              {fields.map((field, index) => {
                const prev = previous?.sets[index];
                return (
                  <div key={field.id} className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2">
                    <span className="text-center text-sm font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      placeholder={prev ? String(prev.weight) : "0"}
                      className="h-12 rounded-xl text-center text-base tabular-nums"
                      {...register(`sets.${index}.weight` as const)}
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder={prev ? String(prev.reps) : "0"}
                      className="h-12 rounded-xl text-center text-base tabular-nums"
                      {...register(`sets.${index}.reps` as const)}
                    />
                  </div>
                );
              })}
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
