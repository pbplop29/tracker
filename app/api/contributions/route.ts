import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { workoutDays, workoutExercises } from "@/db/schema";
import { dateStringSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const fromParsed = dateStringSchema.safeParse(from);
  const toParsed = dateStringSchema.safeParse(to);
  if (!fromParsed.success || !toParsed.success) {
    return NextResponse.json({ error: "from and to (YYYY-MM-DD) are required" }, { status: 400 });
  }

  const rows = await db
    .selectDistinct({ date: workoutDays.date })
    .from(workoutDays)
    .innerJoin(workoutExercises, eq(workoutExercises.workoutDayId, workoutDays.id))
    .where(and(gte(workoutDays.date, fromParsed.data), lte(workoutDays.date, toParsed.data)));

  return NextResponse.json(rows.map((r) => r.date));
}
