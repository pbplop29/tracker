import { create } from "zustand";
import { todayKey } from "@/lib/date";
import type { WorkoutExerciseDto } from "@/lib/types";

interface WorkoutStore {
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  isAddSheetOpen: boolean;
  editingExercise: WorkoutExerciseDto | null;
  openAddSheet: (editing?: WorkoutExerciseDto | null) => void;
  closeAddSheet: () => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  selectedDate: todayKey(),
  setSelectedDate: (date) => set({ selectedDate: date }),

  isAddSheetOpen: false,
  editingExercise: null,
  openAddSheet: (editing = null) => set({ isAddSheetOpen: true, editingExercise: editing }),
  closeAddSheet: () => set({ isAddSheetOpen: false, editingExercise: null }),
}));
