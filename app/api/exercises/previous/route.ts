import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, lte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { exercises, workoutDays, workoutExercises, exerciseSets } from "@/db/schema";
import { dateStringSchema } from "@/lib/validation";
import type { PreviousWorkoutDto } from "@/lib/types";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  const beforeDate = request.nextUrl.searchParams.get("beforeDate");
  const excludeId = request.nextUrl.searchParams.get("excludeId") ?? undefined;

  const dateParsed = dateStringSchema.safeParse(beforeDate);
  if (!name || !dateParsed.success) {
    return NextResponse.json({ error: "name and beforeDate (YYYY-MM-DD) are required" }, { status: 400 });
  }

  const exercise = await db.query.exercises.findFirst({
    where: sql`lower(${exercises.name}) = lower(${name})`,
  });
  if (!exercise) {
    return NextResponse.json(null);
  }

  const conditions = [
    eq(workoutExercises.exerciseId, exercise.id),
    lte(workoutDays.date, dateParsed.data),
  ];
  if (excludeId) conditions.push(ne(workoutExercises.id, excludeId));

  const match = await db
    .select({
      workoutExerciseId: workoutExercises.id,
      date: workoutDays.date,
    })
    .from(workoutExercises)
    .innerJoin(workoutDays, eq(workoutExercises.workoutDayId, workoutDays.id))
    .where(and(...conditions))
    .orderBy(desc(workoutDays.date), desc(workoutExercises.createdAt))
    .limit(1);

  if (match.length === 0) {
    return NextResponse.json(null);
  }

  const setRows = await db
    .select({ setNumber: exerciseSets.setNumber, weight: exerciseSets.weight, reps: exerciseSets.reps })
    .from(exerciseSets)
    .where(eq(exerciseSets.workoutExerciseId, match[0].workoutExerciseId))
    .orderBy(asc(exerciseSets.setNumber));

  const result: PreviousWorkoutDto = { date: match[0].date, sets: setRows };
  return NextResponse.json(result);
}
