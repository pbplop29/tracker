import { NextRequest, NextResponse } from "next/server";
import { asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import type { ExerciseSummaryDto } from "@/lib/types";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  const rows = q
    ? await db
        .select({ id: exercises.id, name: exercises.name })
        .from(exercises)
        .where(sql`lower(${exercises.name}) like lower(${"%" + q + "%"})`)
        .orderBy(asc(exercises.name))
        .limit(20)
    : await db
        .select({ id: exercises.id, name: exercises.name })
        .from(exercises)
        .orderBy(asc(exercises.name))
        .limit(50);

  const result: ExerciseSummaryDto[] = rows;
  return NextResponse.json(result);
}
