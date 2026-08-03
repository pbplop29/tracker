import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { exercises, workoutExercises, exerciseSets } from "@/db/schema";
import { updateWorkoutExerciseSchema } from "@/lib/validation";
import { newId } from "@/lib/id";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/workout-exercises/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = updateWorkoutExerciseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.query.workoutExercises.findFirst({ where: eq(workoutExercises.id, id) });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let exerciseId = existing.exerciseId;
  if (parsed.data.exerciseName) {
    const trimmedName = parsed.data.exerciseName.trim();
    let exercise = await db.query.exercises.findFirst({
      where: sql`lower(${exercises.name}) = lower(${trimmedName})`,
    });
    if (!exercise) {
      const newExerciseId = newId();
      await db.insert(exercises).values({ id: newExerciseId, name: trimmedName });
      exercise = { id: newExerciseId, name: trimmedName, createdAt: new Date().toISOString() };
    }
    exerciseId = exercise.id;
  }

  if (exerciseId !== existing.exerciseId) {
    await db.update(workoutExercises).set({ exerciseId }).where(eq(workoutExercises.id, id));
  }

  await db.delete(exerciseSets).where(eq(exerciseSets.workoutExerciseId, id));
  const setRows = parsed.data.sets.map((s, idx) => ({
    id: newId(),
    workoutExerciseId: id,
    setNumber: idx + 1,
    weight: s.weight,
    reps: s.reps,
  }));
  await db.insert(exerciseSets).values(setRows);

  const exerciseRow = await db.query.exercises.findFirst({ where: eq(exercises.id, exerciseId) });

  return NextResponse.json({
    id,
    exerciseId,
    name: exerciseRow?.name ?? "",
    sets: setRows.map((r) => ({ id: r.id, setNumber: r.setNumber, weight: r.weight, reps: r.reps })),
  });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/workout-exercises/[id]">) {
  const { id } = await ctx.params;
  const existing = await db.query.workoutExercises.findFirst({ where: eq(workoutExercises.id, id) });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.delete(workoutExercises).where(eq(workoutExercises.id, id));
  return NextResponse.json({ ok: true });
}
