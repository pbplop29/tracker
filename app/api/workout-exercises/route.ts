import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { workoutDays, exercises, workoutExercises, exerciseSets } from "@/db/schema";
import { createWorkoutExerciseSchema } from "@/lib/validation";
import { newId } from "@/lib/id";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createWorkoutExerciseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { date, exerciseName, sets } = parsed.data;
  const trimmedName = exerciseName.trim();

  let day = await db.query.workoutDays.findFirst({ where: eq(workoutDays.date, date) });
  if (!day) {
    const id = newId();
    await db.insert(workoutDays).values({ id, date });
    day = { id, date, createdAt: new Date().toISOString() };
  }

  let exercise = await db.query.exercises.findFirst({
    where: sql`lower(${exercises.name}) = lower(${trimmedName})`,
  });
  if (!exercise) {
    const id = newId();
    await db.insert(exercises).values({ id, name: trimmedName });
    exercise = { id, name: trimmedName, createdAt: new Date().toISOString() };
  }

  const existingCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutDayId, day.id));
  const position = existingCount[0]?.count ?? 0;

  const workoutExerciseId = newId();
  await db.insert(workoutExercises).values({
    id: workoutExerciseId,
    workoutDayId: day.id,
    exerciseId: exercise.id,
    position,
  });

  const setRows = sets.map((s, idx) => ({
    id: newId(),
    workoutExerciseId,
    setNumber: idx + 1,
    weight: s.weight,
    reps: s.reps,
  }));
  await db.insert(exerciseSets).values(setRows);

  return NextResponse.json(
    {
      id: workoutExerciseId,
      exerciseId: exercise.id,
      name: exercise.name,
      sets: setRows.map((r) => ({ id: r.id, setNumber: r.setNumber, weight: r.weight, reps: r.reps })),
    },
    { status: 201 }
  );
}
