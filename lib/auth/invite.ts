import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { newId } from "../id";
import { encryptSecret, randomToken, sha256Hex } from "./crypto";
import { generateSecret } from "./totp";

export const INVITE_DAYS = 7;

/**
 * Creates (or re-issues) a pending account and returns the one-time join token.
 * The TOTP secret is generated here and only revealed to whoever opens the join link.
 */
export async function issueInvite(input: { name: string; email: string; isAdmin?: boolean }) {
  const email = input.email.trim().toLowerCase();
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing?.enrolledAt) throw new Error("already-enrolled");

  const token = randomToken();
  const fields = {
    name: input.name.trim(),
    totpSecret: await encryptSecret(generateSecret()),
    inviteTokenHash: await sha256Hex(token),
    inviteExpiresAt: Date.now() + INVITE_DAYS * 86_400_000,
  };

  if (existing) {
    await db.update(users).set(fields).where(eq(users.id, existing.id));
    return { userId: existing.id, token };
  }
  const id = newId();
  await db.insert(users).values({ id, email, isAdmin: input.isAdmin ?? false, ...fields });
  return { userId: id, token };
}
