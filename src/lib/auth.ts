import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserRole, Locale } from '@prisma/client';
import { prisma } from '@/lib/db';

export const SESSION_COOKIE = 'marina_session';
const SESSION_TTL_SECONDS = 60 * 60 * 2; // 2 hours sliding window

export interface SessionPayload {
  userId: number;
  role: UserRole;
  fullName: string;
  lang: Locale;
  tokenVersion: number;
}

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'AUTH_SECRET is missing or too short. Set a long random string in your environment variables.'
    );
  }
  return new TextEncoder().encode(secret);
}

// ── Passwords ───────────────────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── JWT session tokens ───────────────────────────────────────────
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.userId === 'number' &&
      typeof payload.role === 'string' &&
      typeof payload.fullName === 'string' &&
      typeof payload.lang === 'string' &&
      typeof payload.tokenVersion === 'number'
    ) {
      return {
        userId: payload.userId,
        role: payload.role as UserRole,
        fullName: payload.fullName,
        lang: payload.lang as Locale,
        tokenVersion: payload.tokenVersion,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ── Server-side session helpers (Server Components / Actions) ───
/**
 * Reads and verifies the session cookie's JWT signature/shape only.
 * Does NOT check token_version against the DB — that's an edge-safe
 * check done in middleware using data already resolved there. For
 * Server Actions / Server Components that need the DB-verified,
 * up-to-date session (e.g. after a token_version bump), use
 * `requireUser` / `requireStudent` / `requireAdmin`, which re-check
 * token_version and is_active against the database directly.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

// ── Route guards for use inside Server Components / Server Actions ──
// These are the double-guard required by spec §5.4, on top of
// middleware. They re-verify token_version and is_active/email_verified
// against the DB on every call, since the edge-cached JWT can go stale
// the moment an admin deactivates a user or a password is changed.
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect('/auth/login');

  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { tokenVersion: true, isActive: true },
  });

  if (!dbUser || !dbUser.isActive || dbUser.tokenVersion !== session.tokenVersion) {
    clearSessionCookie();
    redirect('/auth/login');
  }

  return session;
}

export async function requireStudent(): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== 'student') redirect('/');

  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { emailVerified: true },
  });

  if (!dbUser?.emailVerified) redirect('/auth/verify-email');

  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== 'admin') redirect('/');
  return session;
}

// ── Email verification tokens ────────────────────────────────────
export function generateVerifyToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
