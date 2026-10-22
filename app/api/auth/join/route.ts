import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { recoveryCodes, users } from "@/db/schema";
import { joinSchema } from "@/lib/validation";
import { decryptSecret, hashRecoveryCode, newRecoveryCodes, sha256Hex } from "@/lib/auth/crypto";
import { otpauthUri, verifyCode } from "@/lib/auth/totp";
import { startSession } from "@/lib/auth/session";
import { newId } from "@/lib/id";

const expired = () => NextResponse.json({ error: "This invite link is invalid or has expired." }, { status: 404 });

async function findPending(token: string) {
  return db.query.users.findFirst({
    where: and(eq(users.inviteTokenHash, await sha256Hex(token)), gt(users.inviteExpiresAt, Date.now()), isNull(users.enrolledAt)),
  });
}

// Reveals the TOTP secret to whoever holds the invite link, so they can add it to their authenticator.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const user = token ? await findPending(token) : undefined;
  if (!user) return expired();
  const secret = await decryptSecret(user.totpSecret);
  return NextResponse.json({ name: user.name, email: user.email, secret, uri: otpauthUri(secret, user.email) });
}

// Confirms the first code, activates the account, and returns one-time recovery codes.
export async function POST(request: NextRequest) {
  const parsed = joinSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });

  const user = await findPending(parsed.data.token);
  if (!user) return expired();

  const step = await verifyCode(await decryptSecret(user.totpSecret), parsed.data.code, 0);
  if (step === null) return NextResponse.json({ error: "That code didn't match. Try the next one." }, { status: 400 });

  // Only one request can activate the account.
  const res = await db
    .update(users)
    .set({ enrolledAt: new Date().toISOString(), lastTotpStep: step, inviteTokenHash: null, inviteExpiresAt: null })
    .where(and(eq(users.id, user.id), isNull(users.enrolledAt)));
  if (res.rowsAffected !== 1) return expired();

  const codes = newRecoveryCodes();
  await db.insert(recoveryCodes).values(
    await Promise.all(codes.map(async (c) => ({ id: newId(), userId: user.id, codeHash: await hashRecoveryCode(c) })))
  );
  await startSession(user.id);
  return NextResponse.json({ recoveryCodes: codes });
}
