import { Redis } from '@upstash/redis';

// ── Rate limiting (spec §5.5) ──────────────────────────────────────
// Uses Upstash Redis (works with Vercel KV, which is Upstash-backed).
// Configure KV_REST_API_URL / KV_REST_API_TOKEN in the environment.

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

/**
 * Returns true if the action is allowed, false if the rate limit has
 * been exceeded. Fails CLOSED (returns false) if Redis is unreachable
 * or unconfigured, in production, so a misconfigured deployment can't
 * silently disable rate limiting on sensitive endpoints. In
 * development without KV configured, fails OPEN so local dev isn't
 * blocked.
 */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const client = getRedis();

  if (!client) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`Rate limiter unavailable (no KV configured) — denying action for key: ${key}`);
      return false;
    }
    return true;
  }

  try {
    const current = await client.incr(key);
    if (current === 1) {
      await client.expire(key, windowSeconds);
    }
    return current <= max;
  } catch (err) {
    console.error('Rate limit check failed:', err);
    return process.env.NODE_ENV !== 'production';
  }
}

export const RATE_LIMITS = {
  login: { max: 5, windowSeconds: 15 * 60 },
  register: { max: 3, windowSeconds: 60 * 60 },
  contact: { max: 3, windowSeconds: 60 * 60 },
  documentUpload: { max: 10, windowSeconds: 60 * 60 },
  statusChange: { max: 20, windowSeconds: 60 * 60 },
} as const;

/** Builds a rate-limit key scoped to an IP or user id and an action name. */
export function rateLimitKey(action: string, scope: string | number): string {
  return `ratelimit:${action}:${scope}`;
}

// ── Magic-bytes file validation (spec §6.3) ────────────────────────
// Never trust the client-supplied MIME type / extension. Inspect the
// actual leading bytes of the file.

type MagicByteKind = 'pdf' | 'jpg' | 'png' | 'webp';

// Keyed by the literal union above (not `string`) so that indexing with a
// known key — MAGIC_BYTES.pdf, MAGIC_BYTES[type] where type is one of the
// literals — resolves to `number[]` directly instead of `number[] | undefined`.
const MAGIC_BYTES: Record<MagicByteKind, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  jpg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF (WebP container)
};

function matches(buffer: Buffer, signature: number[]): boolean {
  if (buffer.length < signature.length) return false;
  return signature.every((byte, i) => buffer[i] === byte);
}

export type ExpectedFileKind = 'pdf' | 'image';

export async function verifyFileType(buffer: Buffer, expected: ExpectedFileKind): Promise<boolean> {
  if (expected === 'pdf') {
    return matches(buffer, MAGIC_BYTES.pdf);
  }
  return (['jpg', 'png', 'webp'] as const).some((type) => matches(buffer, MAGIC_BYTES[type]));
}

// ── Client IP helper (for rate-limit keys + audit logs) ────────────
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return headers.get('x-real-ip') ?? 'unknown';
}
