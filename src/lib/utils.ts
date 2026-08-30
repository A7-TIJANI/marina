import { clsx, type ClassValue } from 'clsx';
import type { Locale } from './i18n';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function fmtDate(date: Date | string | null | undefined, locale: Locale = 'en'): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function fmtDateTime(date: Date | string | null | undefined, locale: Locale = 'en'): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtFileSize(kb: number | null | undefined): string {
  if (!kb) return '';
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}
