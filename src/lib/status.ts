import type { ApplicationStatus } from '@prisma/client';

export const STATUS_FLOW: ApplicationStatus[] = [
  'negotiation',
  'diploma_received',
  'awaiting_payment',
  'payment_confirmed',
  'secondary_equivalence',
  'admission',
  'completed',
];

export const ALL_STATUSES: ApplicationStatus[] = [...STATUS_FLOW, 'cancelled'];

export const FINAL_STATUSES: ApplicationStatus[] = ['completed', 'cancelled'];

export function isFinalStatus(status: ApplicationStatus): boolean {
  return FINAL_STATUSES.includes(status);
}

const BADGE_CLASSES: Record<ApplicationStatus, string> = {
  negotiation: 'bg-slate-100 text-slate-700 ring-slate-300',
  diploma_received: 'bg-sky-100 text-sky-700 ring-sky-300',
  awaiting_payment: 'bg-amber-100 text-amber-700 ring-amber-300',
  payment_confirmed: 'bg-brand-100 text-brand-700 ring-brand-300',
  secondary_equivalence: 'bg-sky-100 text-sky-700 ring-sky-300',
  admission: 'bg-emerald-100 text-emerald-700 ring-emerald-300',
  completed: 'bg-emerald-100 text-emerald-700 ring-emerald-300',
  cancelled: 'bg-rose-100 text-rose-700 ring-rose-300',
};

export function statusBadgeClass(status: ApplicationStatus): string {
  return BADGE_CLASSES[status] ?? BADGE_CLASSES.negotiation;
}
