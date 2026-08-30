'use server';

import { redirect } from 'next/navigation';
import { requireStudent } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { applicationSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import type { ActionState } from '@/lib/action-types';

export async function createApplicationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  // requireStudent double-guards auth + email verification (spec §5.4, §5.6).
  const session = await requireStudent();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const raw = {
    universityId: formData.get('universityId'),
    desiredProgramme: String(formData.get('desiredProgramme') ?? ''),
    notes: String(formData.get('notes') ?? ''),
  };

  const parsed = applicationSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    if (firstError?.path[0] === 'universityId') {
      return { ok: false, message: dict.student.selectUniversityError };
    }
    return { ok: false, message: dict.student.programmeRequired };
  }

  // Prevent duplicate active application to same university.
  const duplicate = await prisma.application.findFirst({
    where: {
      studentId: session.userId,
      universityId: parsed.data.universityId,
      status: { not: 'cancelled' },
    },
  });

  if (duplicate) {
    return { ok: false, message: dict.student.duplicateApplication };
  }

  const newApp = await prisma.application.create({
    data: {
      studentId: session.userId,
      universityId: parsed.data.universityId,
      desiredProgramme: parsed.data.desiredProgramme,
      notes: parsed.data.notes || null,
      status: 'negotiation',
    },
  });

  await prisma.applicationHistory.create({
    data: {
      applicationId: newApp.id,
      changedById: session.userId,
      oldStatus: null,
      newStatus: 'negotiation',
      comment: locale === 'ar' ? 'تم إنشاء الطلب بواسطة الطالب.' : 'Application created by student.',
    },
  });

  await logAudit({
    userId: session.userId,
    action: 'status_change',
    entityType: 'application',
    entityId: newApp.id,
    newValue: { status: 'negotiation' },
  });

  redirect(`/student/applications/${newApp.id}?created=1`);
}
