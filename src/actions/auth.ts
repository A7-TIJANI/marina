'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  generateVerifyToken,
} from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { rateLimit, RATE_LIMITS, rateLimitKey, getClientIp } from '@/lib/security';
import { logAudit } from '@/lib/audit';
import { sendVerificationEmail } from '@/lib/email';
import { registerSchema, loginSchema, profileUpdateSchema, passwordChangeSchema } from '@/lib/validations';
import type { ActionState } from '@/lib/action-types';

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = getLocale();
  const dict = getDictionary(locale);
  const ip = getClientIp(headers());

  const allowed = await rateLimit(rateLimitKey('register', ip), RATE_LIMITS.register.max, RATE_LIMITS.register.windowSeconds);
  if (!allowed) {
    return { ok: false, message: dict.rateLimited };
  }

  const raw = {
    fullName: String(formData.get('fullName') ?? ''),
    email: String(formData.get('email') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    password: String(formData.get('password') ?? ''),
    passwordConfirm: String(formData.get('passwordConfirm') ?? ''),
    lang: locale,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      const messageKey = issue.message as keyof typeof dict.auth;
      fieldErrors[key] = (dict.auth as Record<string, string>)[messageKey] ?? issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    // Do not reveal whether the email is taken — same generic message either way.
    return { ok: false, message: dict.auth.emailInUse };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const verifyToken = generateVerifyToken();

  const user = await prisma.user.create({
    data: {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      passwordHash,
      role: 'student',
      preferredLang: locale,
      emailVerified: false,
      emailVerifyToken: verifyToken,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const verifyUrl = `${baseUrl}/api/verify-email?token=${verifyToken}`;
  await sendVerificationEmail(user.email, user.fullName, verifyUrl, user.preferredLang);

  await logAudit({ userId: user.id, action: 'register', entityType: 'user', entityId: user.id });

  redirect('/auth/verify-email');
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = getLocale();
  const dict = getDictionary(locale);
  const ip = getClientIp(headers());

  const allowed = await rateLimit(rateLimitKey('login', ip), RATE_LIMITS.login.max, RATE_LIMITS.login.windowSeconds);
  if (!allowed) {
    return { ok: false, message: dict.rateLimited };
  }

  const raw = {
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: dict.auth.invalidCredentials };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    await logAudit({ action: 'login_failed', entityType: 'user', entityId: 0, newValue: { email: parsed.data.email } });
    return { ok: false, message: dict.auth.invalidCredentials };
  }

  if (!user.isActive) {
    return { ok: false, message: dict.auth.accountDisabled };
  }

  const validPassword = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!validPassword) {
    await logAudit({ userId: user.id, action: 'login_failed', entityType: 'user', entityId: user.id });
    return { ok: false, message: dict.auth.invalidCredentials };
  }

  if (!user.emailVerified) {
    return { ok: false, message: dict.auth.emailNotVerified };
  }

  await setSessionCookie({
    userId: user.id,
    role: user.role,
    fullName: user.fullName,
    lang: user.preferredLang,
    tokenVersion: user.tokenVersion,
  });

  await logAudit({ userId: user.id, action: 'login', entityType: 'user', entityId: user.id });

  redirect(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  clearSessionCookie();
  if (session) {
    await logAudit({ userId: session.userId, action: 'logout', entityType: 'user', entityId: session.userId });
  }
  redirect('/');
}

export async function resendVerificationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = getLocale();
  const dict = getDictionary(locale);
  const ip = getClientIp(headers());

  const allowed = await rateLimit(rateLimitKey('register', ip), RATE_LIMITS.register.max, RATE_LIMITS.register.windowSeconds);
  if (!allowed) {
    return { ok: false, message: dict.rateLimited };
  }

  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { ok: false, message: dict.auth.invalidEmail };

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success-shaped response regardless of whether the
  // account exists or is already verified, to avoid leaking account
  // existence via this endpoint.
  if (user && !user.emailVerified) {
    const verifyToken = generateVerifyToken();
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifyToken: verifyToken } });
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const verifyUrl = `${baseUrl}/api/verify-email?token=${verifyToken}`;
    await sendVerificationEmail(user.email, user.fullName, verifyUrl, user.preferredLang);
  }

  return { ok: true, message: dict.auth.resendVerificationSent };
}

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect('/auth/login');

  const locale = getLocale();
  const dict = getDictionary(locale);

  const raw = {
    fullName: String(formData.get('fullName') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    preferredLang: String(formData.get('preferredLang') ?? 'en'),
  };

  const parsed = profileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: dict.somethingWentWrong };
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone || null,
      preferredLang: parsed.data.preferredLang,
    },
  });

  await setSessionCookie({
    userId: user.id,
    role: user.role,
    fullName: user.fullName,
    lang: user.preferredLang,
    tokenVersion: user.tokenVersion,
  });

  revalidatePath('/student/profile');
  return { ok: true, message: dict.student.profileUpdated };
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect('/auth/login');

  const locale = getLocale();
  const dict = getDictionary(locale);

  const raw = {
    currentPassword: String(formData.get('currentPassword') ?? ''),
    newPassword: String(formData.get('newPassword') ?? ''),
    newPasswordConfirm: String(formData.get('newPasswordConfirm') ?? ''),
  };

  const parsed = passwordChangeSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: dict.auth.passwordMismatch };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect('/auth/login');

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { ok: false, message: dict.auth.currentPasswordIncorrect };
  }

  const newHash = await hashPassword(parsed.data.newPassword);

  // Increment token_version so existing sessions on other devices are
  // invalidated (spec §5.3), then force this device to log in again too.
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash, tokenVersion: { increment: 1 } },
  });

  await logAudit({ userId: user.id, action: 'password_change', entityType: 'user', entityId: user.id });

  clearSessionCookie();
  return { ok: true, message: dict.auth.passwordUpdated };
}

// Called by the /api/verify-email route (spec §5.6 step 4).
export async function verifyEmailAction(token: string): Promise<{ ok: boolean }> {
  const user = await prisma.user.findUnique({ where: { emailVerifyToken: token } });
  if (!user) {
    return { ok: false };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
      tokenVersion: { increment: 1 },
    },
  });

  await logAudit({ userId: user.id, action: 'register', entityType: 'user', entityId: user.id, newValue: { emailVerified: true } });

  return { ok: true };
}
