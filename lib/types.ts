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
  changePct: number;
  from: number;
  to: number;
  unit: "kg" | "reps";
}

export interface OverviewDto {
  daysPerMonth: { average: number; of: number; trainedDays: number; since: string } | null;
  mostTrained: { name: string; sessions: number }[];
  leastTrained: { name: string; sessions: number }[];
  biggestGains: ProgressItem[];
  leastProgress: ProgressItem[];
  heaviest: { name: string; weight: number; reps: number; date: string }[];
  mostReps: { name: string; reps: number; weight: number; date: string }[];
}
