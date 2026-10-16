import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bodyWeights } from "@/db/schema";
import { bodyWeightSchema, dateStringSchema } from "@/lib/validation";
import { newId } from "@/lib/id";
import type { BodyWeightDto } from "@/lib/types";

export async function GET() {
  const rows: BodyWeightDto[] = await db
    .select({ date: bodyWeights.date, weight: bodyWeights.weight })
    .from(bodyWeights)
    .orderBy(asc(bodyWeights.date));
  return NextResponse.json(rows);
}

// Upsert: one reading per day, logging the same date again overwrites it.
export async function POST(request: NextRequest) {
  const parsed = bodyWeightSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { date, weight } = parsed.data;
  await db
    .insert(bodyWeights)
    .values({ id: newId(), date, weight })
    .onConflictDoUpdate({ target: bodyWeights.date, set: { weight } });
  return NextResponse.json({ date, weight } satisfies BodyWeightDto, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const date = dateStringSchema.safeParse(request.nextUrl.searchParams.get("date"));
  if (!date.success) {
    return NextResponse.json({ error: "Invalid or missing date" }, { status: 400 });
  }
  await db.delete(bodyWeights).where(eq(bodyWeights.date, date.data));
  return NextResponse.json({ ok: true });
}
