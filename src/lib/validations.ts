import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, 'nameRequired').max(150),
    email: z.string().trim().email('invalidEmail').max(150),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
    password: z.string().min(8, 'passwordTooShort').max(72),
    passwordConfirm: z.string().min(1),
    lang: z.enum(['en', 'ar']).default('en'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'passwordMismatch',
    path: ['passwordConfirm'],
  });

export const loginSchema = z.object({
  email: z.string().trim().email().max(150),
  password: z.string().min(1).max(72),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72),
    newPasswordConfirm: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.newPasswordConfirm, {
    message: 'passwordMismatch',
    path: ['newPasswordConfirm'],
  });

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(1).max(150),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  preferredLang: z.enum(['en', 'ar']),
});

export const applicationSchema = z.object({
  universityId: z.coerce.number().int().positive(),
  desiredProgramme: z.string().trim().min(1).max(255),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export const statusChangeSchema = z.object({
  applicationId: z.coerce.number().int().positive(),
  newStatus: z.enum([
    'negotiation',
    'diploma_received',
    'awaiting_payment',
    'payment_confirmed',
    'secondary_equivalence',
    'admission',
    'completed',
    'cancelled',
  ]),
  comment: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const confirmPaymentSchema = z.object({
  applicationId: z.coerce.number().int().positive(),
  amount: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), 'Invalid amount'),
  currency: z.string().trim().max(10).default('USD'),
  comment: z.string().trim().max(1000).optional().or(z.literal('')),
});

// ── Document uploads (NEW — student self-service) ────────────────────
export const studentDocumentUploadSchema = z.object({
  applicationId: z.coerce.number().int().positive(),
  documentType: z.enum(['passport_photo', 'secondary_diploma']),
});

export const adminDocumentUploadSchema = z.object({
  applicationId: z.coerce.number().int().positive(),
  labelEn: z.string().trim().min(1).max(200),
  labelAr: z.string().trim().max(200).optional().or(z.literal('')),
});

export const documentVerifySchema = z.object({
  documentId: z.coerce.number().int().positive(),
  // NOTE: z.coerce.boolean() on a string incorrectly treats "false" as
  // truthy (JS Boolean("false") === true), so this maps the literal
  // strings explicitly instead of coercing.
  verified: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .transform((v) => v === true || v === 'true'),
});

export const documentRejectSchema = z.object({
  documentId: z.coerce.number().int().positive(),
  reason: z.string().trim().min(1).max(500),
});

// ── CMS: bilingual JSONB content ──────────────────────────────────────
const bilingualField = (maxEn: number, maxAr: number) =>
  z.object({
    en: z.string().trim().min(1).max(maxEn),
    ar: z.string().trim().max(maxAr).optional().or(z.literal('')),
  });

export const universitySchema = z.object({
  id: z.coerce.number().int().optional(),
  nameEn: z.string().trim().min(1).max(200),
  nameAr: z.string().trim().max(200).optional().or(z.literal('')),
  descriptionEn: z.string().trim().max(5000).optional().or(z.literal('')),
  descriptionAr: z.string().trim().max(5000).optional().or(z.literal('')),
  city: z.string().trim().min(1).max(100),
  websiteUrl: z.string().trim().max(255).optional().or(z.literal('')),
  isActive: z.coerce.boolean().default(true),
});

export const faqSchema = z.object({
  id: z.coerce.number().int().optional(),
  questionEn: z.string().trim().min(1).max(400),
  questionAr: z.string().trim().max(400).optional().or(z.literal('')),
  answerEn: z.string().trim().min(1),
  answerAr: z.string().trim().optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().min(0).max(255).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const countryInfoSchema = z.object({
  id: z.coerce.number().int().optional(),
  sectionKey: z.string().trim().min(1).max(80),
  sectionTitleEn: z.string().trim().min(1).max(200),
  sectionTitleAr: z.string().trim().max(200).optional().or(z.literal('')),
  contentEn: z.string().trim().min(1),
  contentAr: z.string().trim().optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().min(0).max(255).default(0),
});

export const contactMessageSchema = z.object({
  senderName: z.string().trim().min(1).max(150),
  senderEmail: z.string().trim().email().max(150),
  message: z.string().trim().min(1).max(4000),
});

// re-export bilingualField in case future schemas want it
export { bilingualField };
