import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { exercises, workoutExercises } from "@/db/schema";
import type { ExerciseSummaryDto } from "@/lib/types";

export async function GET() {
  const rows = await db
    .selectDistinct({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .innerJoin(workoutExercises, eq(workoutExercises.exerciseId, exercises.id))
    .orderBy(asc(exercises.name));

  const result: ExerciseSummaryDto[] = rows;
  return NextResponse.json(result);
}
