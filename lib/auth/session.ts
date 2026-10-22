import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users, type User } from "../../db/schema";
import { signSession, verifySession } from "./crypto";

const COOKIE = "gg_session";
const SESSION_DAYS = 30;

export async function startSession(userId: string) {
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  (await cookies()).set(COOKIE, await signSession(userId, expires), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** The logged-in, fully enrolled user, or null. Loaded from the DB each time so removed users lose access at once. */
export async function currentUser(): Promise<User | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  const userId = value ? await verifySession(value) : null;
  if (!userId) return null;
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  return user?.enrolledAt ? user : null;
}

export const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
