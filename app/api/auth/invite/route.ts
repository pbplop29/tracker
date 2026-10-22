import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { inviteSchema } from "@/lib/validation";
import { issueInvite } from "@/lib/auth/invite";
import { currentUser, unauthorized } from "@/lib/auth/session";

const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  if (!user.isAdmin) return forbidden();
  const rows = await db.select({ name: users.name, email: users.email, enrolledAt: users.enrolledAt }).from(users).orderBy(asc(users.createdAt));
  return NextResponse.json(rows.map((r) => ({ name: r.name, email: r.email, enrolled: Boolean(r.enrolledAt) })));
}

// Admin only. Creates (or re-issues, for someone who hasn't joined yet) a one-time join link.
export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();
  if (!user.isAdmin) return forbidden();

  const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a name and a valid email." }, { status: 400 });

  try {
    const { token } = await issueInvite(parsed.data);
    return NextResponse.json({ url: `${request.nextUrl.origin}/join?token=${token}` }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "already-enrolled") {
      return NextResponse.json({ error: "That person already has an account." }, { status: 409 });
    }
    throw err;
  }
}
