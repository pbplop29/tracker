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

export const bodyWeightSchema = z.object({
  date: dateStringSchema,
  weight: z.number().min(20).max(400),
});

const emailSchema = z.string().trim().toLowerCase().email().max(200);

export const loginSchema = z.object({ email: emailSchema, code: z.string().trim().min(6).max(20) });
export const joinSchema = z.object({ token: z.string().min(20).max(200), code: z.string().regex(/^\d{6}$/) });
export const inviteSchema = z.object({ name: z.string().trim().min(1).max(100), email: emailSchema });

export type SetInput = z.infer<typeof setInputSchema>;
export type CreateWorkoutExerciseInput = z.infer<typeof createWorkoutExerciseSchema>;
export type UpdateWorkoutExerciseInput = z.infer<typeof updateWorkoutExerciseSchema>;
