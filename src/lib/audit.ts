import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { getClientIp } from '@/lib/security';

export type AuditAction =
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'register'
  | 'password_change'
  | 'status_change'
  | 'payment_confirm'
  | 'document_upload'
  | 'document_delete'
  | 'document_verify'
  | 'university_create'
  | 'university_update'
  | 'university_delete'
  | 'faq_create'
  | 'faq_update'
  | 'faq_delete'
  | 'country_info_update';

export type AuditEntityType = 'user' | 'application' | 'document' | 'university' | 'faq' | 'country_info';

interface LogAuditInput {
  userId?: number;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: number;
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * Writes an immutable audit log row. Never throws — a logging failure
 * must not roll back or block the underlying mutation, but it is
 * always reported via console.error so it can be alerted on.
 */
export async function logAudit(data: LogAuditInput): Promise<void> {
  try {
    const hdrs = headers();
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValue: data.oldValue === undefined ? undefined : (data.oldValue as object),
        newValue: data.newValue === undefined ? undefined : (data.newValue as object),
        ipAddress: getClientIp(hdrs),
        userAgent: hdrs.get('user-agent') ?? 'unknown',
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', data.action, data.entityType, data.entityId, err);
  }
}
