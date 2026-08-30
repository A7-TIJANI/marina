import { cookies } from 'next/headers';
import type { Locale } from './i18n';

export const LOCALE_COOKIE = 'lang';

export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return value === 'ar' ? 'ar' : 'en';
}

export function setLocaleCookie(locale: Locale) {
  cookies().set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
}
