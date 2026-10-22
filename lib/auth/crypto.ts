// Web Crypto helpers (Node + Workers). Everything derives from the AUTH_SECRET env var.
const enc = new TextEncoder();

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw new Error("AUTH_SECRET is missing or too short (min 16 chars)");
  return secret;
}

const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
const toB64Url = (bytes: Uint8Array) => toB64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64Url = (text: string) => fromB64(text.replace(/-/g, "+").replace(/_/g, "/"));

export async function sha256Hex(text: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(text)));
  return Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken(bytes = 32): string {
  return toB64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

// Separate keys per purpose so the same secret never serves two jobs.
async function aesKey() {
  const raw = await crypto.subtle.digest("SHA-256", enc.encode(`gg-totp:${authSecret()}`));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptSecret(plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(), enc.encode(plain)));
  return `${toB64(iv)}.${toB64(ct)}`;
}

export async function decryptSecret(blob: string): Promise<string> {
  const [iv, ct] = blob.split(".");
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(iv) as BufferSource }, await aesKey(), fromB64(ct) as BufferSource);
  return new TextDecoder().decode(plain);
}

async function hmacKey() {
  return crypto.subtle.importKey("raw", enc.encode(`gg-session:${authSecret()}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signSession(userId: string, expiresAtMs: number): Promise<string> {
  const payload = `${userId}.${expiresAtMs}`;
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(payload)));
  return `${payload}.${toB64Url(sig)}`;
}

/** Returns the user id if the signature is valid and unexpired. subtle.verify is constant-time. */
export async function verifySession(value: string): Promise<string | null> {
  const [userId, exp, sig] = value.split(".");
  if (!userId || !exp || !sig || Number(exp) < Date.now()) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(), fromB64Url(sig) as BufferSource, enc.encode(`${userId}.${exp}`));
    return ok ? userId : null;
  } catch {
    return null;
  }
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alikes (0/O, 1/I)

export function newRecoveryCodes(count = 8): string[] {
  return Array.from({ length: count }, () => {
    const chars = Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
    return `${chars.slice(0, 5)}-${chars.slice(5)}`;
  });
}

export const hashRecoveryCode = (code: string) => sha256Hex(code.replace(/[^A-Za-z0-9]/g, "").toUpperCase());
