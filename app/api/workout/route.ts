import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutDays, workoutExercises, exercises, exerciseSets } from "@/db/schema";
import { dateStringSchema } from "@/lib/validation";
import type { WorkoutDayDto } from "@/lib/types";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  const parsed = dateStringSchema.safeParse(date);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid or missing date" }, { status: 400 });
  }

  const day = await db.query.workoutDays.findFirst({
    where: eq(workoutDays.date, parsed.data),
  });

  if (!day) {
    const empty: WorkoutDayDto = { date: parsed.data, exercises: [] };
    return NextResponse.json(empty);
  }

  const rows = await db
    .select({
      workoutExerciseId: workoutExercises.id,
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      position: workoutExercises.position,
      setId: exerciseSets.id,
      setNumber: exerciseSets.setNumber,
      weight: exerciseSets.weight,
      reps: exerciseSets.reps,
    })
    .from(workoutExercises)
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .leftJoin(exerciseSets, eq(exerciseSets.workoutExerciseId, workoutExercises.id))
    .where(eq(workoutExercises.workoutDayId, day.id))
    .orderBy(asc(workoutExercises.position), asc(exerciseSets.setNumber));

  const byWorkoutExercise = new Map<string, WorkoutDayDto["exercises"][number]>();
  for (const row of rows) {
    let entry = byWorkoutExercise.get(row.workoutExerciseId);
    if (!entry) {
      entry = { id: row.workoutExerciseId, exerciseId: row.exerciseId, name: row.exerciseName, sets: [] };
      byWorkoutExercise.set(row.workoutExerciseId, entry);
    }
    if (row.setId) {
      entry.sets.push({ id: row.setId, setNumber: row.setNumber!, weight: row.weight!, reps: row.reps! });
    }
  }

  const result: WorkoutDayDto = {
    date: parsed.data,
    exercises: Array.from(byWorkoutExercise.values()),
  };

  return NextResponse.json(result);
}
