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

export interface BodyWeightDto {
  date: string;
  weight: number;
}

export interface ProgressItem {
  name: string;
  /** Rate of change of session volume, as % of the average volume per week (negative = declining). */
  ratePct: number;
  /** Average volume per session: kg moved (weight x reps), or total reps for bodyweight exercises. */
  volume: number;
  unit: "kg" | "reps";
}

export interface OverviewDto {
  daysPerMonth: { average: number; of: number } | null;
  mostTrained: { name: string; sessions: number }[];
  leastTrained: { name: string; sessions: number }[];
  mostProgress: ProgressItem[];
  leastProgress: ProgressItem[];
}
