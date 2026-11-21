import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users, type User } from "../../db/schema";
import { signSession, verifySession } from "./crypto";
import { getOrCreateDevUser } from "./dev-user";

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

// Local `next dev` signs you in automatically (set DEV_AUTO_LOGIN=off to test the real sign-in flow).
// NODE_ENV is "production" for builds and on Cloudflare, so this is false there and the branch is compiled out.
const devAutoLogin = () => process.env.NODE_ENV === "development" && process.env.DEV_AUTO_LOGIN !== "off";

/** The logged-in, fully enrolled user, or null. Loaded from the DB each time so removed users lose access at once. */
export async function currentUser(): Promise<User | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  const userId = value ? await verifySession(value) : null;
  if (userId) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (user?.enrolledAt) return user; // a real session still wins, so multi-user flows can be tried locally
  }
  return devAutoLogin() ? getOrCreateDevUser() : null;
}

export const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
