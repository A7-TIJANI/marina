import { put, del } from '@vercel/blob';
import sharp from 'sharp';
import { verifyFileType } from '@/lib/security';

export class FileValidationError extends Error {}

const MAX_PASSPORT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DIPLOMA_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_ADMIN_DOC_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];

// ── Student: passport photo (spec §6.1, §6.4) ──────────────────────
// Resize to max 1200px, convert to WebP, strip EXIF (sharp drops EXIF
// by default unless .withMetadata() is called, so we simply don't).
export async function processPassportPhoto(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
}

export async function assertValidPassportPhoto(file: File, buffer: Buffer): Promise<void> {
  if (!ALLOWED_IMAGE_MIME.includes(file.type)) {
    throw new FileValidationError('Only JPEG, PNG, or WebP images are allowed.');
  }
  if (file.size > MAX_PASSPORT_SIZE_BYTES) {
    throw new FileValidationError('Photo is too large (max 5 MB).');
  }
  if (file.size === 0) {
    throw new FileValidationError('File is empty.');
  }
  const isValidImage = await verifyFileType(buffer, 'image');
  if (!isValidImage) {
    throw new FileValidationError('File content does not match an accepted image format.');
  }
}

// ── Student: secondary diploma (spec §6.1) ──────────────────────────
export async function assertValidDiploma(file: File, buffer: Buffer): Promise<void> {
  if (file.type !== 'application/pdf') {
    throw new FileValidationError('Only PDF files are allowed.');
  }
  if (file.size > MAX_DIPLOMA_SIZE_BYTES) {
    throw new FileValidationError('File is too large (max 10 MB).');
  }
  if (file.size === 0) {
    throw new FileValidationError('File is empty.');
  }
  const isValidPdf = await verifyFileType(buffer, 'pdf');
  if (!isValidPdf) {
    throw new FileValidationError('File content does not match a valid PDF.');
  }
}

// ── Admin: arbitrary supporting document (PDF) ──────────────────────
export async function assertValidAdminDocument(file: File, buffer: Buffer): Promise<void> {
  if (file.type !== 'application/pdf') {
    throw new FileValidationError('Only PDF files are allowed.');
  }
  if (file.size > MAX_ADMIN_DOC_SIZE_BYTES) {
    throw new FileValidationError('File is too large (max 10 MB).');
  }
  if (file.size === 0) {
    throw new FileValidationError('File is empty.');
  }
  const isValidPdf = await verifyFileType(buffer, 'pdf');
  if (!isValidPdf) {
    throw new FileValidationError('File content does not match a valid PDF.');
  }
}

// ── Blob key patterns (spec §6.5) ────────────────────────────────────
export function passportBlobKey(applicationId: number): string {
  return `applications/${applicationId}/student/passport_${Date.now()}.webp`;
}

export function diplomaBlobKey(applicationId: number): string {
  return `applications/${applicationId}/student/diploma_${Date.now()}.pdf`;
}

export function adminDocBlobKey(applicationId: number, label: string): string {
  const safeLabel = label.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(0, 60);
  return `applications/${applicationId}/admin/${Date.now()}_${safeLabel}.pdf`;
}

export function universityImageBlobKey(universityId: number, ext: string): string {
  return `universities/${universityId}/cover_${Date.now()}.${ext}`;
}

// ── Generic upload/delete ────────────────────────────────────────────
export async function uploadBlob(
  key: string,
  data: Buffer,
  contentType: string,
  addRandomSuffix = true
): Promise<{ url: string; sizeKb: number }> {
  const blob = await put(key, data, {
    access: 'public',
    addRandomSuffix,
    contentType,
  });
  return { url: blob.url, sizeKb: Math.ceil(data.length / 1024) };
}

export async function deleteBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch (err) {
    console.error('Failed to delete blob:', url, err);
  }
}

// ── University images ────────────────────────────────────────────────
export function assertValidUniversityImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
    throw new FileValidationError('Only JPEG, PNG, WebP, or AVIF images are allowed.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new FileValidationError('Image is too large (max 5 MB).');
  }
  if (file.size === 0) {
    throw new FileValidationError('Image file is empty.');
  }
}
