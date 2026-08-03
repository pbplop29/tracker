import { z } from "zod";

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const setInputSchema = z.object({
  weight: z.coerce.number().min(0).max(2000),
  reps: z.coerce.number().int().min(0).max(200),
});

export const createWorkoutExerciseSchema = z.object({
  date: dateStringSchema,
  exerciseName: z.string().trim().min(1).max(100),
  sets: z.array(setInputSchema).min(1).max(12),
});

export const updateWorkoutExerciseSchema = z.object({
  exerciseName: z.string().trim().min(1).max(100).optional(),
  sets: z.array(setInputSchema).min(1).max(12),
});

export type SetInput = z.infer<typeof setInputSchema>;
export type CreateWorkoutExerciseInput = z.infer<typeof createWorkoutExerciseSchema>;
export type UpdateWorkoutExerciseInput = z.infer<typeof updateWorkoutExerciseSchema>;
