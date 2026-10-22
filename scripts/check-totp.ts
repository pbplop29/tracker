// Runnable check: RFC 6238 SHA-1 test vectors (8-digit codes truncated to the last 6) + base32 round trip.
// Run with: npx tsx scripts/check-totp.ts
import assert from "node:assert/strict";
import { base32Encode, base32Decode, codeForStep, verifyCode, generateSecret } from "../lib/auth/totp";

const secret = base32Encode(new TextEncoder().encode("12345678901234567890"));
const vectors: [number, string][] = [[59, "287082"], [1111111109, "081804"], [1234567890, "005924"], [2000000000, "279037"]];

async function main() {
  for (const [time, expected] of vectors) {
    assert.equal(await codeForStep(secret, Math.floor(time / 30)), expected, `vector t=${time}`);
  }
  const s = generateSecret();
  assert.deepEqual(base32Decode(s), base32Decode(base32Encode(base32Decode(s))));
  const now = 1_700_000_000_000;
  const step = Math.floor(now / 30000);
  const code = await codeForStep(s, step);
  assert.equal(await verifyCode(s, code, 0, now), step);
  assert.equal(await verifyCode(s, code, step, now), null, "reused code must be rejected");
  assert.equal(await verifyCode(s, "000000" === code ? "111111" : "000000", 0, now), null);
  console.log("totp ok");
}
main();
