import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { workoutDays, exercises, workoutExercises, exerciseSets } from "@/db/schema";
import { createWorkoutExerciseSchema } from "@/lib/validation";
import { newId } from "@/lib/id";
import { currentUser, unauthorized } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = createWorkoutExerciseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { date, exerciseName, sets } = parsed.data;
  const trimmedName = exerciseName.trim();

  let dayId = (
    await db.query.workoutDays.findFirst({ where: and(eq(workoutDays.date, date), eq(workoutDays.userId, user.id)) })
  )?.id;
  if (!dayId) {
    dayId = newId();
    await db.insert(workoutDays).values({ id: dayId, userId: user.id, date });
  }

  let exercise = await db.query.exercises.findFirst({
    where: and(sql`lower(${exercises.name}) = lower(${trimmedName})`, eq(exercises.userId, user.id)),
  });
  if (!exercise) {
    const id = newId();
    await db.insert(exercises).values({ id, userId: user.id, name: trimmedName });
    exercise = { id, userId: user.id, name: trimmedName, createdAt: new Date().toISOString() };
  }

  const existingCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutDayId, dayId));
  const position = existingCount[0]?.count ?? 0;

  const workoutExerciseId = newId();
  await db.insert(workoutExercises).values({
    id: workoutExerciseId,
    workoutDayId: dayId,
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
