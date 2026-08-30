import type { ApplicationStatus, Locale } from '@prisma/client';
import { dictionaries } from './i18n';

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Marina <no-reply@example.com>';

  if (!apiKey) {
    // No email provider configured — log instead of failing.
    // Wire up RESEND_API_KEY in your environment to send real emails.
    console.log(`[email:dev] To: ${to} | Subject: ${subject}\n${html}`);
    return;
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
  } catch (err) {
    console.error('Failed to send email:', err);
  }
}

function wrap(dir: string, body: string) {
  return `<div style="font-family:sans-serif;direction:${dir}">${body}</div>`;
}

/** Escapes user-supplied text before interpolating into email HTML. */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Registration / verification (spec §5.6, §11.1) ──────────────────
export async function sendVerificationEmail(
  studentEmail: string,
  studentName: string,
  verifyUrl: string,
  lang: Locale
) {
  const dict = dictionaries[lang] ?? dictionaries.en;
  const subject = lang === 'ar' ? 'فعّل بريدك الإلكتروني — مارينا' : 'Verify your email — Marina';
  const html = wrap(
    dict.dir,
    `
      <p>${lang === 'ar' ? `مرحباً ${escapeHtml(studentName)}،` : `Hi ${escapeHtml(studentName)},`}</p>
      <p>${
        lang === 'ar'
          ? 'يرجى الضغط على الرابط التالي لتفعيل حسابك:'
          : 'Please click the link below to verify your email address and activate your account:'
      }</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>${lang === 'ar' ? 'فريق مارينا' : 'The Marina Team'}</p>
    `
  );
  await sendEmail(studentEmail, subject, html);
}

// ── Status changes ────────────────────────────────────────────────
export async function sendStatusEmail(
  studentEmail: string,
  studentName: string,
  newStatus: ApplicationStatus,
  comment: string | null,
  lang: Locale
) {
  const dict = dictionaries[lang] ?? dictionaries.en;
  const statusLabel = dict.statuses[newStatus];
  const subject = lang === 'ar' ? `تحديث حالة طلبك: ${statusLabel}` : `Your application status: ${statusLabel}`;
  const html = wrap(
    dict.dir,
    `
      <p>${lang === 'ar' ? `مرحباً ${escapeHtml(studentName)}،` : `Hi ${escapeHtml(studentName)},`}</p>
      <p>${
        lang === 'ar'
          ? `تم تحديث حالة طلبك إلى: <strong>${statusLabel}</strong>`
          : `Your application status has been updated to: <strong>${statusLabel}</strong>`
      }</p>
      ${comment ? `<p style="color:#555">${escapeHtml(comment)}</p>` : ''}
      <p>${lang === 'ar' ? 'فريق مارينا' : 'The Marina Team'}</p>
    `
  );
  await sendEmail(studentEmail, subject, html);
}

// ── Payment confirmation ─────────────────────────────────────────────
export async function sendPaymentEmail(
  studentEmail: string,
  studentName: string,
  confirmedAt: Date,
  amount: string | null,
  currency: string,
  lang: Locale
) {
  const dict = dictionaries[lang] ?? dictionaries.en;
  const subject = lang === 'ar' ? 'تم تأكيد دفعتك' : 'Your payment has been confirmed';
  const html = wrap(
    dict.dir,
    `
      <p>${lang === 'ar' ? `مرحباً ${escapeHtml(studentName)}،` : `Hi ${escapeHtml(studentName)},`}</p>
      <p>${
        lang === 'ar'
          ? `تم تأكيد دفعتك بتاريخ ${confirmedAt.toLocaleDateString()}${amount ? ` بمبلغ ${amount} ${currency}` : ''}.`
          : `Your payment was confirmed on ${confirmedAt.toLocaleDateString()}${amount ? ` for ${amount} ${currency}` : ''}.`
      }</p>
      <p>${lang === 'ar' ? 'فريق مارينا' : 'The Marina Team'}</p>
    `
  );
  await sendEmail(studentEmail, subject, html);
}

// ── Document verified / rejected (NEW — spec §11.1) ──────────────────
const DOC_TYPE_LABEL: Record<string, { en: string; ar: string }> = {
  passport_photo: { en: 'passport photo', ar: 'صورة جواز السفر' },
  secondary_diploma: { en: 'secondary diploma', ar: 'شهادة الثانوية' },
  transcript: { en: 'transcript', ar: 'كشف الدرجات' },
};

export async function sendDocumentVerifiedEmail(
  studentEmail: string,
  studentName: string,
  documentType: string,
  lang: Locale
) {
  const dict = dictionaries[lang] ?? dictionaries.en;
  const label = DOC_TYPE_LABEL[documentType]?.[lang] ?? documentType;
  const subject = lang === 'ar' ? 'تم توثيق وثيقتك' : 'Your document has been verified';
  const html = wrap(
    dict.dir,
    `
      <p>${lang === 'ar' ? `مرحباً ${escapeHtml(studentName)}،` : `Hi ${escapeHtml(studentName)},`}</p>
      <p>${lang === 'ar' ? `تم توثيق ${label} الخاصة بك بنجاح.` : `Your ${label} has been verified.`}</p>
      <p>${lang === 'ar' ? 'فريق مارينا' : 'The Marina Team'}</p>
    `
  );
  await sendEmail(studentEmail, subject, html);
}

export async function sendDocumentRejectedEmail(
  studentEmail: string,
  studentName: string,
  documentType: string,
  reason: string,
  lang: Locale
) {
  const dict = dictionaries[lang] ?? dictionaries.en;
  const label = DOC_TYPE_LABEL[documentType]?.[lang] ?? documentType;
  const subject = lang === 'ar' ? 'يرجى إعادة رفع وثيقتك' : 'Please re-upload your document';
  const html = wrap(
    dict.dir,
    `
      <p>${lang === 'ar' ? `مرحباً ${escapeHtml(studentName)}،` : `Hi ${escapeHtml(studentName)},`}</p>
      <p>${
        lang === 'ar'
          ? `تم رفض ${label} الخاصة بك: ${escapeHtml(reason)}. يرجى إعادة رفعها.`
          : `Your ${label} was rejected: ${escapeHtml(reason)}. Please re-upload it.`
      }</p>
      <p>${lang === 'ar' ? 'فريق مارينا' : 'The Marina Team'}</p>
    `
  );
  await sendEmail(studentEmail, subject, html);
}

// ── Contact form ─────────────────────────────────────────────────────
export async function sendContactNotification(senderName: string, senderEmail: string, message: string) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) return;
  await sendEmail(
    adminEmail,
    `New contact message from ${escapeHtml(senderName)}`,
    `<p><strong>${escapeHtml(senderName)}</strong> (${escapeHtml(senderEmail)}) wrote:</p><p>${escapeHtml(message)}</p>`
  );
}
