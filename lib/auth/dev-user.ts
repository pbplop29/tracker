import { asc, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "../../db";
import { users, type User } from "../../db/schema";
import { newId } from "../id";

// LOCAL DEVELOPMENT ONLY (see devAutoLogin in session.ts): the account `next dev` signs you in as,
// so you never need an authenticator app locally. Prefers an existing enrolled account (admin first),
// otherwise creates a throwaway one. It has no usable TOTP secret, so nobody can sign in as it for real.
export async function getOrCreateDevUser(): Promise<User> {
  const [existing] = await db
    .select()
    .from(users)
    .where(isNotNull(users.enrolledAt))
    .orderBy(desc(users.isAdmin), asc(users.createdAt))
    .limit(1);
  if (existing) return existing;

  const email = "dev@local.test";
  await db
    .insert(users)
    .values({ id: newId(), name: "Local Dev", email, isAdmin: true, totpSecret: "dev-only-not-usable", enrolledAt: new Date().toISOString() })
    .onConflictDoNothing(); // two first requests at once: the unique email keeps it to one row
  return (await db.query.users.findFirst({ where: eq(users.email, email) }))!;
}
