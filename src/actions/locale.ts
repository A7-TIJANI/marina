'use server';

import { revalidatePath } from 'next/cache';
import { setLocaleCookie } from '@/lib/locale';
import { getSession, setSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { Locale } from '@/lib/i18n';

export async function switchLocale(formData: FormData) {
  const locale = (formData.get('locale') as Locale) || 'en';
  const pathname = (formData.get('pathname') as string) || '/';

  setLocaleCookie(locale);

  const session = await getSession();
  if (session) {
    await prisma.user.update({
      where: { id: session.userId },
      data: { preferredLang: locale },
    });
    await setSessionCookie({ ...session, lang: locale });
  }

  revalidatePath(pathname);
}
