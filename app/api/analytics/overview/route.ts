import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { exercises, exerciseSets, workoutDays, workoutExercises } from "@/db/schema";
import { dateStringSchema } from "@/lib/validation";
import { computeOverview } from "@/lib/overview";
import { currentUser, unauthorized } from "@/lib/auth/session";

// Progress > Overall: every stat is computed live from this user's logged sets (all time).
// `today` is the caller's local date, so "days trained per month" doesn't depend on the server's timezone.
export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const today = dateStringSchema.safeParse(request.nextUrl.searchParams.get("today"));

  const rows = await db
    .select({
      exerciseId: exercises.id,
      name: exercises.name,
      date: workoutDays.date,
      weight: exerciseSets.weight,
      reps: exerciseSets.reps,
    })
    .from(exerciseSets)
    .innerJoin(workoutExercises, eq(exerciseSets.workoutExerciseId, workoutExercises.id))
    .innerJoin(workoutDays, eq(workoutExercises.workoutDayId, workoutDays.id))
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(eq(workoutDays.userId, user.id));

  return NextResponse.json(computeOverview(rows, today.success ? today.data : new Date().toISOString().slice(0, 10)));
}
