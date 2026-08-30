'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { requireStudent, requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { rateLimit, RATE_LIMITS, rateLimitKey } from '@/lib/security';
import { logAudit } from '@/lib/audit';
import { sendDocumentVerifiedEmail, sendDocumentRejectedEmail } from '@/lib/email';
import {
  studentDocumentUploadSchema,
  adminDocumentUploadSchema,
  documentVerifySchema,
  documentRejectSchema,
} from '@/lib/validations';
import {
  FileValidationError,
  assertValidPassportPhoto,
  assertValidDiploma,
  assertValidAdminDocument,
  processPassportPhoto,
  passportBlobKey,
  diplomaBlobKey,
  adminDocBlobKey,
  uploadBlob,
  deleteBlob,
} from '@/lib/storage';
import type { ActionState } from '@/lib/action-types';

// This file processes uploaded images with `sharp`, which requires the
// Node.js runtime (not Edge). No route segment in this app opts into
// the Edge runtime, so this runs on Node.js by default (spec §6.4).

// ── Student: upload passport photo or diploma (spec §6.2, §7.2) ──────
export async function uploadStudentDocumentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireStudent();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const allowed = await rateLimit(
    rateLimitKey('documentUpload', session.userId),
    RATE_LIMITS.documentUpload.max,
    RATE_LIMITS.documentUpload.windowSeconds
  );
  if (!allowed) {
    return { ok: false, message: dict.rateLimited };
  }

  const raw = {
    applicationId: formData.get('applicationId'),
    documentType: String(formData.get('documentType') ?? ''),
  };
  const parsed = studentDocumentUploadSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: dict.somethingWentWrong };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: dict.somethingWentWrong };
  }

  // Ownership check — the application must belong to this student.
  const application = await prisma.application.findUnique({
    where: { id: parsed.data.applicationId },
    select: { id: true, studentId: true },
  });
  if (!application || application.studentId !== session.userId) {
    return { ok: false, message: dict.somethingWentWrong };
  }

  const { documentType } = parsed.data;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    // Declared as plain `Buffer` (not inferred from `buffer`) because
    // `buffer` narrows to `Buffer<ArrayBuffer>` (from Buffer.from(arrayBuffer)),
    // while processPassportPhoto()/sharp's .toBuffer() returns the wider
    // `Buffer<ArrayBufferLike>` — the narrower inferred type would reject
    // that reassignment below.
    let finalBuffer: Buffer = buffer;
    let contentType: string;
    let blobKey: string;

    if (documentType === 'passport_photo') {
      await assertValidPassportPhoto(file, buffer);
      finalBuffer = await processPassportPhoto(Buffer.from(buffer));
      contentType = 'image/webp';
      blobKey = passportBlobKey(application.id);
    } else {
      await assertValidDiploma(file, buffer);
      contentType = 'application/pdf';
      blobKey = diplomaBlobKey(application.id);
    }

    // Quota: max 1 per document type per application. Replace = delete
    // old blob + old row (spec §6.6).
    const existing = await prisma.document.findFirst({
      where: { applicationId: application.id, documentType },
    });

    const { url, sizeKb } = await uploadBlob(blobKey, finalBuffer, contentType, true);

    const doc = await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.document.delete({ where: { id: existing.id } });
      }
      return tx.document.create({
        data: {
          applicationId: application.id,
          uploadedById: session.userId,
          documentType,
          fileUrl: url,
          fileSizeKb: sizeKb,
          mimeType: contentType,
          isVerified: false,
        },
      });
    });

    if (existing) {
      await deleteBlob(existing.fileUrl);
    }

    await logAudit({
      userId: session.userId,
      action: 'document_upload',
      entityType: 'document',
      entityId: doc.id,
      newValue: { documentType, applicationId: application.id },
    });

    revalidatePath(`/student/applications/${application.id}`);
    revalidatePath(`/admin/applications/${application.id}`);

    return { ok: true, message: dict.student.uploadSuccess };
  } catch (err) {
    if (err instanceof FileValidationError) {
      return { ok: false, message: err.message };
    }
    console.error('Document upload failed:', err);
    return { ok: false, message: dict.student.uploadErrorGeneric };
  }
}

// ── Student: delete own unverified document (spec §7.2) ──────────────
export async function deleteOwnDocumentAction(documentId: number): Promise<ActionState> {
  const session = await requireStudent();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { application: { select: { id: true, studentId: true } } },
  });

  if (!doc || doc.application.studentId !== session.userId) {
    return { ok: false, message: dict.somethingWentWrong };
  }

  if (doc.isVerified) {
    return { ok: false, message: dict.student.cannotDeleteVerified };
  }

  await prisma.document.delete({ where: { id: doc.id } });
  await deleteBlob(doc.fileUrl);

  await logAudit({
    userId: session.userId,
    action: 'document_delete',
    entityType: 'document',
    entityId: doc.id,
    oldValue: { documentType: doc.documentType },
  });

  revalidatePath(`/student/applications/${doc.application.id}`);
  revalidatePath(`/admin/applications/${doc.application.id}`);

  return { ok: true };
}

// ── Admin: upload a labeled supporting document (spec §7.3) ──────────
export async function uploadAdminDocumentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const raw = {
    applicationId: formData.get('applicationId'),
    labelEn: String(formData.get('labelEn') ?? ''),
    labelAr: String(formData.get('labelAr') ?? ''),
  };
  const parsed = adminDocumentUploadSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: dict.somethingWentWrong };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: dict.somethingWentWrong };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await assertValidAdminDocument(file, buffer);

    const blobKey = adminDocBlobKey(parsed.data.applicationId, parsed.data.labelEn);
    const { url, sizeKb } = await uploadBlob(blobKey, buffer, 'application/pdf', true);

    const doc = await prisma.document.create({
      data: {
        applicationId: parsed.data.applicationId,
        uploadedById: session.userId,
        documentType: 'admin_document',
        label: { en: parsed.data.labelEn, ar: parsed.data.labelAr || undefined },
        fileUrl: url,
        fileSizeKb: sizeKb,
        mimeType: 'application/pdf',
        isVerified: true, // admin-authored documents don't need review
      },
    });

    await logAudit({
      userId: session.userId,
      action: 'document_upload',
      entityType: 'document',
      entityId: doc.id,
      newValue: { documentType: 'admin_document', applicationId: parsed.data.applicationId },
    });

    revalidatePath(`/admin/applications/${parsed.data.applicationId}`);
    revalidatePath(`/student/applications/${parsed.data.applicationId}`);

    return { ok: true, message: dict.admin.documentUploaded };
  } catch (err) {
    if (err instanceof FileValidationError) {
      return { ok: false, message: err.message };
    }
    console.error('Admin document upload failed:', err);
    return { ok: false, message: dict.somethingWentWrong };
  }
}

// ── Admin: verify a student document (spec §7.3, §8.4) ───────────────
export async function verifyDocumentAction(formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const raw = {
    documentId: formData.get('documentId'),
    verified: formData.get('verified') ?? 'true',
  };
  const parsed = documentVerifySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: dict.somethingWentWrong };
  }

  const doc = await prisma.document.findUnique({
    where: { id: parsed.data.documentId },
    include: { application: { include: { student: true } } },
  });
  if (!doc) return { ok: false, message: dict.somethingWentWrong };

  await prisma.document.update({
    where: { id: doc.id },
    data: { isVerified: parsed.data.verified },
  });

  await logAudit({
    userId: session.userId,
    action: 'document_verify',
    entityType: 'document',
    entityId: doc.id,
    oldValue: { isVerified: doc.isVerified },
    newValue: { isVerified: parsed.data.verified },
  });

  if (parsed.data.verified && doc.documentType !== 'admin_document') {
    await sendDocumentVerifiedEmail(
      doc.application.student.email,
      doc.application.student.fullName,
      doc.documentType,
      doc.application.student.preferredLang
    );
  }

  revalidatePath(`/admin/applications/${doc.applicationId}`);
  revalidatePath(`/student/applications/${doc.applicationId}`);

  return { ok: true, message: dict.admin.documentVerified };
}

// ── Admin: reject a student document with a reason (spec §8.4) ───────
export async function rejectDocumentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const raw = {
    documentId: formData.get('documentId'),
    reason: String(formData.get('reason') ?? ''),
  };
  const parsed = documentRejectSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: dict.admin.rejectReasonRequired };
  }

  const doc = await prisma.document.findUnique({
    where: { id: parsed.data.documentId },
    include: { application: { include: { student: true } } },
  });
  if (!doc) return { ok: false, message: dict.somethingWentWrong };

  await prisma.document.update({ where: { id: doc.id }, data: { isVerified: false } });

  await logAudit({
    userId: session.userId,
    action: 'document_verify',
    entityType: 'document',
    entityId: doc.id,
    oldValue: { isVerified: doc.isVerified },
    newValue: { isVerified: false, rejectionReason: parsed.data.reason },
  });

  await sendDocumentRejectedEmail(
    doc.application.student.email,
    doc.application.student.fullName,
    doc.documentType,
    parsed.data.reason,
    doc.application.student.preferredLang
  );

  revalidatePath(`/admin/applications/${doc.applicationId}`);
  revalidatePath(`/student/applications/${doc.applicationId}`);

  return { ok: true, message: dict.admin.documentRejected };
}

// ── Admin: delete any document (spec §7.3) ────────────────────────────
export async function deleteDocumentAction(documentId: number): Promise<ActionState> {
  const session = await requireAdmin();

  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return { ok: false };

  await prisma.document.delete({ where: { id: doc.id } });
  await deleteBlob(doc.fileUrl);

  await logAudit({
    userId: session.userId,
    action: 'document_delete',
    entityType: 'document',
    entityId: doc.id,
    oldValue: { documentType: doc.documentType },
  });

  revalidatePath(`/admin/applications/${doc.applicationId}`);
  revalidatePath(`/student/applications/${doc.applicationId}`);

  return { ok: true };
}
