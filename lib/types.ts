export interface SetDto {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
}

export interface WorkoutExerciseDto {
  id: string;
  exerciseId: string;
  name: string;
  sets: SetDto[];
}

export interface WorkoutDayDto {
  date: string;
  exercises: WorkoutExerciseDto[];
}

export interface ExerciseSummaryDto {
  id: string;
  name: string;
}

export interface PreviousWorkoutDto {
  date: string;
  sets: { setNumber: number; weight: number; reps: number }[];
}

export interface AnalyticsPointDto {
  date: string;
  sets: { setNumber: number; weight: number; reps: number }[];
}
