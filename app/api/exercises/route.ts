import { NextResponse } from "next/server";
import { and, asc, eq, exists, sql } from "drizzle-orm";
import { db } from "@/db";
import { exercises, workoutExercises } from "@/db/schema";
import { currentUser, unauthorized } from "@/lib/auth/session";
import type { ExerciseSummaryDto } from "@/lib/types";

// Autofill list, fetched once when the add sheet opens and filtered on the device.
// Only this user's exercises that appear in at least one logged workout: names whose every
// entry was deleted (or renamed away) stay in the table but are no longer suggested.
export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  const isLogged = exists(
    db.select({ one: sql`1` }).from(workoutExercises).where(eq(workoutExercises.exerciseId, exercises.id))
  );

  const rows: ExerciseSummaryDto[] = await db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .where(and(eq(exercises.userId, user.id), isLogged))
    .orderBy(asc(exercises.name))
    .limit(1000);

  return NextResponse.json(rows);
}
