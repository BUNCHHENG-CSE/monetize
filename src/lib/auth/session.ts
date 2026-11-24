import { createHmac, randomBytes, scryptSync, timingSafeEqual, createHash } from "crypto";

export const SESSION_COOKIE = "devtool_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const isProduction = process.env.NODE_ENV === "production";

/**
 * One-click demo logins and passwordless auto-registration are development
 * conveniences. They are off in production unless explicitly opted in.
 */
export const isDemoAuthEnabled = !isProduction || process.env.ALLOW_DEMO_LOGIN === "true";

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (isProduction) {
    throw new Error("SESSION_SECRET must be set (>= 32 chars) in production.");
  }
  return "dev-only-insecure-session-secret-change-me";
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

/** Cookie value format: base64url(userId).expiresAtSeconds.signature */
export function createSessionToken(userId: string, maxAgeSeconds = SESSION_MAX_AGE): string {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const payload = `${Buffer.from(userId).toString("base64url")}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

/** Returns the userId for a valid, unexpired, correctly signed token; otherwise null. */
export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedId, expStr, signature] = parts;
  const payload = `${encodedId}.${expStr}`;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;

  try {
    return Buffer.from(encodedId, "base64url").toString("utf8") || null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
};

// -----------------------------------------------------------------------------
// Password hashing (salted scrypt; verifies legacy unsalted sha256 hashes too)
// -----------------------------------------------------------------------------
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (stored.startsWith("scrypt$")) {
    const [, salt, hash] = stored.split("$");
    if (!salt || !hash) return false;
    const expected = Buffer.from(hash, "hex");
    const actual = scryptSync(password, salt, expected.length);
    return timingSafeEqual(expected, actual);
  }
  // Legacy format: unsalted sha256 hex.
  const expected = Buffer.from(stored, "hex");
  const actual = createHash("sha256").update(password).digest();
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** True when the stored hash should be upgraded to the current format. */
export function needsRehash(stored: string): boolean {
  return !stored.startsWith("scrypt$");
}
