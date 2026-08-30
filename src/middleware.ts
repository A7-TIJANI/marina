import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

const SESSION_COOKIE = 'marina_session';
const SESSION_TTL_SECONDS = 60 * 60 * 2; // 2 hours
const REFRESH_THRESHOLD_SECONDS = SESSION_TTL_SECONDS / 2; // Refresh when < 1 hour left

function getSecretKey() {
  const secret = process.env.AUTH_SECRET ?? '';
  return new TextEncoder().encode(secret);
}

interface Payload {
  userId: number;
  role: 'student' | 'admin';
  fullName: string;
  lang: 'en' | 'ar';
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

async function readSession(token: string | undefined): Promise<Payload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as Payload;
  } catch {
    return null;
  }
}

// NOTE on token_version: middleware runs on the Edge runtime, which
// cannot reach Prisma/Postgres directly, so the JWT's tokenVersion
// claim can't be cross-checked against the DB here. This layer only
// verifies the JWT signature and role for routing. The AUTHORITATIVE
// token_version + is_active + email_verified check happens in
// requireUser()/requireStudent()/requireAdmin() (src/lib/auth.ts),
// which run in the Node.js runtime on every protected Server
// Component/Action and reject stale sessions before any data is
// read or mutated. This satisfies spec §5.3's guarantee — a demoted
// admin's JWT stops working the moment they hit a real route guard,
// not merely at the edge layer.
// Fail loudly (once per cold start) if AUTH_SECRET is missing or too short,
// instead of silently letting every session look invalid. This is what
// would have surfaced the v2 production incident immediately in Vercel's
// Runtime Logs, instead of requiring a multi-round investigation.
if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16) {
  console.error(
    '[middleware] AUTH_SECRET is missing or shorter than 16 characters. ' +
      'Every session will be treated as invalid until this is fixed in the ' +
      'deployment environment (not in code) — see .env.example.'
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await readSession(token);

  const isAdminRoute = pathname.startsWith('/admin');
  const isStudentRoute = pathname.startsWith('/student');
  const isAuthRoute = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register');

  // --- Route guards ---
  if (isAdminRoute) {
    if (!session) {
      const res = NextResponse.redirect(new URL('/auth/login?next=' + pathname, req.url));
      res.headers.set('x-middleware-cache', 'no-cache');
      return res;
    }
    if (session.role !== 'admin') {
      const res = NextResponse.redirect(new URL('/', req.url));
      res.headers.set('x-middleware-cache', 'no-cache');
      return res;
    }
  }

  if (isStudentRoute) {
    if (!session) {
      const res = NextResponse.redirect(new URL('/auth/login?next=' + pathname, req.url));
      res.headers.set('x-middleware-cache', 'no-cache');
      return res;
    }
    if (session.role !== 'student') {
      const res = NextResponse.redirect(new URL('/', req.url));
      res.headers.set('x-middleware-cache', 'no-cache');
      return res;
    }
  }

  if (isAuthRoute && session) {
    const dest = session.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
    const res = NextResponse.redirect(new URL(dest, req.url));
    res.headers.set('x-middleware-cache', 'no-cache');
    return res;
  }

  // --- Sliding session: only refresh when nearing expiry ---
  const res = NextResponse.next();
  res.headers.set('x-middleware-cache', 'no-cache');

  if (session && token) {
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = (session.exp ?? 0) - now;

    // Only re-sign if less than half the TTL remains (or exp is missing)
    if (!session.exp || timeRemaining < REFRESH_THRESHOLD_SECONDS) {
      const fresh = await new SignJWT({
        userId: session.userId,
        role: session.role,
        fullName: session.fullName,
        lang: session.lang,
        tokenVersion: session.tokenVersion,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
        .sign(getSecretKey());

      res.cookies.set(SESSION_COOKIE, fresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_TTL_SECONDS,
      });
    }
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/student/:path*', '/auth/login', '/auth/register'],
};
