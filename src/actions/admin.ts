'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import DOMPurify from 'isomorphic-dompurify';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { rateLimit, RATE_LIMITS, rateLimitKey } from '@/lib/security';
import { logAudit } from '@/lib/audit';
import { sendStatusEmail, sendPaymentEmail } from '@/lib/email';
import { isFinalStatus } from '@/lib/status';
import { assertValidUniversityImage, universityImageBlobKey, uploadBlob, deleteBlob } from '@/lib/storage';
import { FileValidationError } from '@/lib/storage';
import { statusChangeSchema, confirmPaymentSchema, universitySchema, faqSchema, countryInfoSchema } from '@/lib/validations';
import type { ApplicationStatus } from '@prisma/client';
import type { ActionState } from '@/lib/action-types';

function stripHtml(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

// ── Status change (spec §7.3) ─────────────────────────────────────────
export async function changeStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const allowed = await rateLimit(
    rateLimitKey('statusChange', session.userId),
    RATE_LIMITS.statusChange.max,
    RATE_LIMITS.statusChange.windowSeconds
  );
  if (!allowed) return { ok: false, message: dict.rateLimited };

  const parsed = statusChangeSchema.safeParse({
    applicationId: formData.get('applicationId'),
    newStatus: formData.get('newStatus'),
    comment: formData.get('comment'),
  });

  if (!parsed.success) return { ok: false, message: dict.somethingWentWrong };

  const { applicationId, newStatus, comment } = parsed.data;
  const sanitizedComment = comment ? stripHtml(comment) : null;

  const app = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: { student: { select: { email: true, fullName: true, preferredLang: true } } },
  });

  if (isFinalStatus(app.status)) {
    return { ok: false, message: dict.admin.cannotChangeFinal };
  }

  if ((app.status as ApplicationStatus) === newStatus) {
    return { ok: false, message: dict.admin.sameStatus };
  }

  const oldStatus = app.status;
  await prisma.application.update({ where: { id: applicationId }, data: { status: newStatus } });
  await prisma.applicationHistory.create({
    data: { applicationId, changedById: session.userId, oldStatus, newStatus, comment: sanitizedComment },
  });

  await logAudit({
    userId: session.userId,
    action: 'status_change',
    entityType: 'application',
    entityId: applicationId,
    oldValue: { status: oldStatus },
    newValue: { status: newStatus },
  });

  await sendStatusEmail(app.student.email, app.student.fullName, newStatus, sanitizedComment, app.student.preferredLang);

  revalidatePath(`/admin/applications/${applicationId}`);
  return { ok: true, message: dict.admin.statusUpdated };
}

// ── Confirm payment (spec §7.3) ───────────────────────────────────────
export async function confirmPaymentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const parsed = confirmPaymentSchema.safeParse({
    applicationId: formData.get('applicationId'),
    amount: formData.get('amount'),
    currency: formData.get('currency'),
    comment: formData.get('comment'),
  });

  if (!parsed.success) return { ok: false, message: dict.somethingWentWrong };

  const { applicationId, amount, currency, comment } = parsed.data;
  const sanitizedComment = comment ? stripHtml(comment) : null;

  const app = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: { student: { select: { email: true, fullName: true, preferredLang: true } } },
  });

  if (app.status === 'payment_confirmed') {
    return { ok: false, message: dict.admin.paymentAlreadyConfirmed };
  }
  if (isFinalStatus(app.status)) {
    return { ok: false, message: dict.admin.cannotChangeFinal };
  }

  const now = new Date();
  const oldStatus = app.status;

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: 'payment_confirmed',
      paymentConfirmedAt: now,
      paymentConfirmedById: session.userId,
      paymentAmount: amount ? parseFloat(amount) : null,
      paymentCurrency: currency || 'USD',
    },
  });

  await prisma.applicationHistory.create({
    data: {
      applicationId,
      changedById: session.userId,
      oldStatus,
      newStatus: 'payment_confirmed',
      comment: sanitizedComment || (locale === 'ar' ? 'تم تأكيد الدفع من قِبل الإدارة.' : 'Payment confirmed by admin.'),
    },
  });

  await logAudit({
    userId: session.userId,
    action: 'payment_confirm',
    entityType: 'application',
    entityId: applicationId,
    newValue: { amount, currency },
  });

  await sendPaymentEmail(app.student.email, app.student.fullName, now, amount || null, currency || 'USD', app.student.preferredLang);

  revalidatePath(`/admin/applications/${applicationId}`);
  return { ok: true, message: dict.admin.paymentConfirmedNotice };
}

// ── University CRUD (JSONB bilingual fields) ──────────────────────────
export async function saveUniversityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const parsed = universitySchema.safeParse({
    id: formData.get('id'),
    nameEn: formData.get('nameEn'),
    nameAr: formData.get('nameAr'),
    descriptionEn: formData.get('descriptionEn'),
    descriptionAr: formData.get('descriptionAr'),
    city: formData.get('city'),
    websiteUrl: formData.get('websiteUrl'),
    isActive: formData.get('isActive') === 'true',
  });

  if (!parsed.success) return { ok: false, message: dict.somethingWentWrong };

  const { id, nameEn, nameAr, descriptionEn, descriptionAr, city, websiteUrl, isActive } = parsed.data;

  const data = {
    name: { en: nameEn, ar: nameAr || undefined },
    description: descriptionEn ? { en: descriptionEn, ar: descriptionAr || undefined } : undefined,
    city,
    websiteUrl: websiteUrl || null,
    isActive,
  };

  const imageFile = formData.get('image');
  const removeImage = formData.get('removeImage') === 'true';

  let imageUrl: string | null | undefined;
  let universityId = id;

  try {
    if (!universityId) {
      const created = await prisma.university.create({ data });
      universityId = created.id;
      await logAudit({ userId: session.userId, action: 'university_create', entityType: 'university', entityId: created.id, newValue: data });
    }

    if (removeImage) {
      const existing = await prisma.university.findUnique({ where: { id: universityId }, select: { imageUrl: true } });
      if (existing?.imageUrl) await deleteBlob(existing.imageUrl);
      imageUrl = null;
    } else if (imageFile instanceof File && imageFile.size > 0) {
      assertValidUniversityImage(imageFile);
      const existing = await prisma.university.findUnique({ where: { id: universityId }, select: { imageUrl: true } });
      if (existing?.imageUrl) await deleteBlob(existing.imageUrl);
      const ext = imageFile.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const uploaded = await uploadBlob(universityImageBlobKey(universityId, ext), buffer, imageFile.type, false);
      imageUrl = uploaded.url;
    }

    const finalData = imageUrl !== undefined ? { ...data, imageUrl } : data;

    if (id) {
      await prisma.university.update({ where: { id }, data: finalData });
      await logAudit({ userId: session.userId, action: 'university_update', entityType: 'university', entityId: id, newValue: finalData });
    } else if (imageUrl !== undefined) {
      await prisma.university.update({ where: { id: universityId }, data: { imageUrl } });
    }
  } catch (err) {
    if (err instanceof FileValidationError) return { ok: false, message: err.message };
    console.error(err);
    return { ok: false, message: dict.somethingWentWrong };
  }

  revalidatePath('/admin/cms/universities');
  revalidatePath('/universities');
  revalidatePath('/');
  redirect('/admin/cms/universities');
}

export async function deleteUniversityAction(id: number): Promise<void> {
  const session = await requireAdmin();
  await prisma.university.update({ where: { id }, data: { isActive: false } });
  await logAudit({ userId: session.userId, action: 'university_delete', entityType: 'university', entityId: id });
  revalidatePath('/admin/cms/universities');
  revalidatePath('/universities');
}

// ── FAQ CRUD (JSONB bilingual fields) ──────────────────────────────────
export async function saveFaqAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const parsed = faqSchema.safeParse({
    id: formData.get('id'),
    questionEn: formData.get('questionEn'),
    questionAr: formData.get('questionAr'),
    answerEn: formData.get('answerEn'),
    answerAr: formData.get('answerAr'),
    sortOrder: formData.get('sortOrder'),
    isActive: formData.get('isActive') === 'true',
  });

  if (!parsed.success) return { ok: false, message: dict.somethingWentWrong };

  const { id, questionEn, questionAr, answerEn, answerAr, sortOrder, isActive } = parsed.data;
  const data = {
    question: { en: questionEn, ar: questionAr || undefined },
    answer: { en: stripHtml(answerEn), ar: answerAr ? stripHtml(answerAr) : undefined },
    sortOrder,
    isActive,
  };

  if (id) {
    await prisma.faq.update({ where: { id }, data });
    await logAudit({ userId: session.userId, action: 'faq_update', entityType: 'faq', entityId: id, newValue: data });
  } else {
    const created = await prisma.faq.create({ data });
    await logAudit({ userId: session.userId, action: 'faq_create', entityType: 'faq', entityId: created.id, newValue: data });
  }

  revalidatePath('/admin/cms/faqs');
  revalidatePath('/faq');
  redirect('/admin/cms/faqs');
}

export async function deleteFaqAction(id: number): Promise<void> {
  const session = await requireAdmin();
  await prisma.faq.delete({ where: { id } });
  await logAudit({ userId: session.userId, action: 'faq_delete', entityType: 'faq', entityId: id });
  revalidatePath('/admin/cms/faqs');
  revalidatePath('/faq');
}

// ── Country info CRUD (JSONB bilingual fields) ─────────────────────────
export async function saveCountryInfoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const parsed = countryInfoSchema.safeParse({
    id: formData.get('id'),
    sectionKey: formData.get('sectionKey'),
    sectionTitleEn: formData.get('sectionTitleEn'),
    sectionTitleAr: formData.get('sectionTitleAr'),
    contentEn: formData.get('contentEn'),
    contentAr: formData.get('contentAr'),
    sortOrder: formData.get('sortOrder'),
  });

  if (!parsed.success) return { ok: false, message: dict.somethingWentWrong };

  const { id, sectionKey, sectionTitleEn, sectionTitleAr, contentEn, contentAr, sortOrder } = parsed.data;
  const data = {
    sectionKey,
    title: { en: sectionTitleEn, ar: sectionTitleAr || undefined },
    content: { en: stripHtml(contentEn), ar: contentAr ? stripHtml(contentAr) : undefined },
    sortOrder,
  };

  if (id) {
    await prisma.countryInfo.update({ where: { id }, data });
    await logAudit({ userId: session.userId, action: 'country_info_update', entityType: 'country_info', entityId: id, newValue: data });
  } else {
    const created = await prisma.countryInfo.create({ data });
    await logAudit({ userId: session.userId, action: 'country_info_update', entityType: 'country_info', entityId: created.id, newValue: data });
  }

  revalidatePath('/admin/cms/country-info');
  revalidatePath('/about');
  redirect('/admin/cms/country-info');
}
