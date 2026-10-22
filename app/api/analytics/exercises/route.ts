import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { exercises, workoutExercises } from "@/db/schema";
import { currentUser, unauthorized } from "@/lib/auth/session";
import type { ExerciseSummaryDto } from "@/lib/types";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  const rows = await db
    .selectDistinct({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .innerJoin(workoutExercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(eq(exercises.userId, user.id))
    .orderBy(asc(exercises.name));

  const result: ExerciseSummaryDto[] = rows;
  return NextResponse.json(result);
}
