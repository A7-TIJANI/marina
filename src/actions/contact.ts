'use server';

import { headers } from 'next/headers';
import DOMPurify from 'isomorphic-dompurify';
import { prisma } from '@/lib/db';
import { sendContactNotification } from '@/lib/email';
import { contactMessageSchema } from '@/lib/validations';
import { rateLimit, RATE_LIMITS, rateLimitKey, getClientIp } from '@/lib/security';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import type { ActionState } from '@/lib/action-types';

export async function submitContactAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = getLocale();
  const dict = getDictionary(locale);
  const ip = getClientIp(headers());

  const allowed = await rateLimit(rateLimitKey('contact', ip), RATE_LIMITS.contact.max, RATE_LIMITS.contact.windowSeconds);
  if (!allowed) {
    return { ok: false, message: dict.rateLimited };
  }

  const raw = {
    senderName: String(formData.get('senderName') ?? ''),
    senderEmail: String(formData.get('senderEmail') ?? ''),
    message: String(formData.get('message') ?? ''),
  };

  const parsed = contactMessageSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: dict.somethingWentWrong };
  }

  // Sanitize free-text before persisting (spec §5.8). Strip all tags —
  // this is a plain-text contact message, not rich content.
  const sanitizedMessage = DOMPurify.sanitize(parsed.data.message, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  const sanitizedName = DOMPurify.sanitize(parsed.data.senderName, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

  await prisma.contactMessage.create({
    data: {
      senderName: sanitizedName,
      senderEmail: parsed.data.senderEmail,
      message: sanitizedMessage,
    },
  });

  await sendContactNotification(sanitizedName, parsed.data.senderEmail, sanitizedMessage);

  return { ok: true, message: dict.public.messageSent };
}
