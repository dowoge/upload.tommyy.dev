import { cookies } from "next/headers";
import { createHash, randomBytes, timingSafeEqual } from "crypto";

const SESSION_COOKIE_NAME = "upload_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// globalThis keeps sessions alive across HMR in dev
const globalStore = globalThis as typeof globalThis & {
  __upload_sessions?: Map<string, { expiresAt: number }>;
};

if (!globalStore.__upload_sessions) {
  globalStore.__upload_sessions = new Map();
}

const sessions = globalStore.__upload_sessions;

export function validatePassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("ADMIN_PASSWORD environment variable is not set");
    return false;
  }

  const inputBuffer = Buffer.from(password);
  const storedBuffer = Buffer.from(adminPassword);

  if (inputBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, storedBuffer);
}

export function createSession(): string {
  const token = randomBytes(32).toString("hex");
  const hashed = hashToken(token);

  sessions.set(hashed, {
    expiresAt: Date.now() + SESSION_DURATION_MS,
  });

  for (const [key, session] of sessions.entries()) {
    if (session.expiresAt < Date.now()) {
      sessions.delete(key);
    }
  }

  return token;
}

export function isValidSession(token: string): boolean {
  const hashed = hashToken(token);
  const session = sessions.get(hashed);

  if (!session) return false;

  if (session.expiresAt < Date.now()) {
    sessions.delete(hashed);
    return false;
  }

  return true;
}

export function destroySession(token: string): void {
  const hashed = hashToken(token);
  sessions.delete(hashed);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) return false;

  return isValidSession(sessionCookie.value);
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function getSessionDurationMs(): number {
  return SESSION_DURATION_MS;
}