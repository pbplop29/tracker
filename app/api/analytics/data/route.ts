import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutDays, workoutExercises, exerciseSets } from "@/db/schema";
import { currentUser, unauthorized } from "@/lib/auth/session";
import type { AnalyticsPointDto } from "@/lib/types";

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const exerciseId = request.nextUrl.searchParams.get("exerciseId");
  if (!exerciseId) {
    return NextResponse.json({ error: "exerciseId is required" }, { status: 400 });
  }

  const rows = await db
    .select({
      date: workoutDays.date,
      workoutExerciseId: workoutExercises.id,
      setNumber: exerciseSets.setNumber,
      weight: exerciseSets.weight,
      reps: exerciseSets.reps,
    })
    .from(workoutExercises)
    .innerJoin(workoutDays, eq(workoutExercises.workoutDayId, workoutDays.id))
    .innerJoin(exerciseSets, eq(exerciseSets.workoutExerciseId, workoutExercises.id))
    .where(and(eq(workoutExercises.exerciseId, exerciseId), eq(workoutDays.userId, user.id)))
    .orderBy(asc(workoutDays.date), asc(exerciseSets.setNumber));

  const byDate = new Map<string, AnalyticsPointDto>();
  for (const row of rows) {
    let entry = byDate.get(row.date);
    if (!entry) {
      entry = { date: row.date, sets: [] };
      byDate.set(row.date, entry);
    }
    entry.sets.push({ setNumber: row.setNumber, weight: row.weight, reps: row.reps });
  }

  const result: AnalyticsPointDto[] = Array.from(byDate.values());
  return NextResponse.json(result);
}
