import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { recoveryCodes, users } from "@/db/schema";
import { loginSchema } from "@/lib/validation";
import { decryptSecret, hashRecoveryCode } from "@/lib/auth/crypto";
import { verifyCode } from "@/lib/auth/totp";
import { startSession } from "@/lib/auth/session";

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60_000;

// Same answer for unknown email, wrong code, or not-yet-enrolled, so emails can't be probed.
const invalid = () => NextResponse.json({ error: "Invalid email or code" }, { status: 401 });

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return invalid();
  const { email, code } = parsed.data;

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user?.enrolledAt) return invalid();
  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }

  let ok = false;
  if (/^\d{6}$/.test(code)) {
    const step = await verifyCode(await decryptSecret(user.totpSecret), code, user.lastTotpStep);
    if (step !== null) {
      // Atomic claim of this time step: two concurrent requests can't both reuse one code.
      const res = await db
        .update(users)
        .set({ lastTotpStep: step })
        .where(and(eq(users.id, user.id), lt(users.lastTotpStep, step)));
      ok = res.rowsAffected === 1;
    }
  } else {
    // Recovery code: single use.
    const res = await db
      .update(recoveryCodes)
      .set({ usedAt: new Date().toISOString() })
      .where(
        and(eq(recoveryCodes.userId, user.id), eq(recoveryCodes.codeHash, await hashRecoveryCode(code)), isNull(recoveryCodes.usedAt))
      );
    ok = res.rowsAffected === 1;
  }

  if (!ok) {
    const failed = user.failedAttempts + 1;
    await db
      .update(users)
      .set(failed >= MAX_ATTEMPTS ? { failedAttempts: 0, lockedUntil: Date.now() + LOCK_MS } : { failedAttempts: failed })
      .where(eq(users.id, user.id));
    return invalid();
  }

  await db.update(users).set({ failedAttempts: 0, lockedUntil: null }).where(eq(users.id, user.id));
  await startSession(user.id);
  return NextResponse.json({ ok: true });
}
