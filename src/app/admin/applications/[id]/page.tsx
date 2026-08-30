import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary, getLocalized } from '@/lib/i18n';
import { fmtDate, fmtDateTime, fmtFileSize } from '@/lib/utils';
import { statusBadgeClass, STATUS_FLOW, isFinalStatus } from '@/lib/status';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { StatusChangeForm } from './StatusChangeForm';
import { ConfirmPaymentForm } from './ConfirmPaymentForm';
import { UploadDocumentForm } from './UploadDocumentForm';
import { DeleteDocumentButton } from './DeleteDocumentButton';
import { DocumentList } from '@/components/upload/DocumentList';
import type { ApplicationStatus } from '@prisma/client';

interface Props {
  params: { id: string };
}

export default async function AdminApplicationDetailPage({ params }: Props) {
  await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const appId = parseInt(params.id, 10);
  if (isNaN(appId)) notFound();

  const app = await prisma.application.findUnique({
    where: { id: appId },
    include: {
      student: { select: { fullName: true, email: true, phone: true } },
      university: true,
      paymentConfirmedBy: { select: { fullName: true } },
    },
  });

  if (!app) notFound();

  const [history, documents] = await Promise.all([
    prisma.applicationHistory.findMany({
      where: { applicationId: appId },
      include: { changedBy: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.document.findMany({
      where: { applicationId: appId },
      include: { uploadedBy: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const canChange = !isFinalStatus(app.status as ApplicationStatus);
  const availableStatuses: ApplicationStatus[] = canChange ? [...STATUS_FLOW.filter((s) => s !== app.status), 'cancelled'] : [];

  const studentDocs = documents.filter((d) => d.documentType !== 'admin_document');
  const adminDocs = documents.filter((d) => d.documentType === 'admin_document');
  const universityName = getLocalized(app.university.name as { en: string; ar?: string }, locale);

  return (
    <div>
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/applications" className="hover:text-slate-900">
          {dict.nav.applications}
        </Link>
        <span>›</span>
        <span>#{app.id}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-start gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-slate-900">{app.student.fullName}</h1>
          <p className="text-sm text-slate-500">
            {app.student.email}
            {app.student.phone && ` · ${app.student.phone}`}
          </p>
        </div>
        <Badge className={`text-sm ${statusBadgeClass(app.status as ApplicationStatus)}`}>{dict.statuses[app.status]}</Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="space-y-5">
          <Card>
            <CardHeader>{dict.student.applicationDetail}</CardHeader>
            <CardBody>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <dt className="font-semibold text-slate-600">{dict.student.university}</dt>
                <dd>{universityName}</dd>
                <dt className="font-semibold text-slate-600">{dict.student.programme}</dt>
                <dd>{app.desiredProgramme}</dd>
                <dt className="font-semibold text-slate-600">{dict.student.submitted}</dt>
                <dd>{fmtDate(app.createdAt, locale)}</dd>
                {app.notes && (
                  <>
                    <dt className="font-semibold text-slate-600">{dict.student.notes}</dt>
                    <dd className="col-span-1">{app.notes}</dd>
                  </>
                )}
              </dl>
            </CardBody>
          </Card>

          {/* Student-uploaded document verification — spec §8.4 */}
          <Card>
            <CardHeader>{dict.admin.studentDocumentsTitle}</CardHeader>
            <DocumentList
              documents={studentDocs.map((d) => ({
                id: d.id,
                documentType: d.documentType,
                fileUrl: d.fileUrl,
                fileSizeKb: d.fileSizeKb,
                mimeType: d.mimeType,
                isVerified: d.isVerified,
                createdAt: d.createdAt.toISOString(),
                uploadedByName: d.uploadedBy.fullName,
              }))}
              dict={dict}
              locale={locale}
            />
          </Card>

          {canChange && (
            <Card>
              <CardHeader>{dict.admin.changeStatus}</CardHeader>
              <CardBody>
                <StatusChangeForm applicationId={app.id} currentStatus={app.status as ApplicationStatus} availableStatuses={availableStatuses} dict={dict} />
              </CardBody>
            </Card>
          )}

          {app.status !== 'payment_confirmed' && canChange ? (
            <Card>
              <CardHeader>{dict.admin.confirmPayment}</CardHeader>
              <CardBody>
                <p className="mb-4 text-sm text-slate-500">{dict.admin.confirmPaymentNotice}</p>
                <ConfirmPaymentForm applicationId={app.id} dict={dict} />
              </CardBody>
            </Card>
          ) : app.paymentConfirmedAt ? (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <span className="mt-0.5 text-emerald-600">✓</span>
              <div className="text-sm">
                <p className="font-bold text-emerald-900">{dict.student.paymentConfirmed}</p>
                <p className="text-emerald-700">
                  {fmtDate(app.paymentConfirmedAt, locale)}
                  {app.paymentConfirmedBy && ` · ${app.paymentConfirmedBy.fullName}`}
                  {app.paymentAmount && ` · ${app.paymentAmount} ${app.paymentCurrency}`}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <Card>
            <CardHeader>{dict.admin.uploadDocument}</CardHeader>
            <CardBody>
              <UploadDocumentForm applicationId={app.id} dict={dict} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>{dict.student.adminDocumentsTitle}</CardHeader>
            {adminDocs.length === 0 ? (
              <CardBody>
                <p className="text-sm text-slate-500">{dict.student.noAdminDocuments}</p>
              </CardBody>
            ) : (
              <ul className="divide-y divide-slate-100">
                {adminDocs.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-2 px-5 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {getLocalized(doc.label as { en: string; ar?: string } | null, locale)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {fmtFileSize(doc.fileSizeKb)} · {fmtDate(doc.createdAt, locale)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-slate-50"
                      >
                        ↓
                      </a>
                      <DeleteDocumentButton documentId={doc.id} confirmLabel={dict.confirmDelete} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader>{dict.student.statusHistory}</CardHeader>
            <CardBody>
              {history.length === 0 ? (
                <p className="text-sm text-slate-500">{dict.noResults}</p>
              ) : (
                <ol className="space-y-4">
                  {history.map((h) => (
                    <li key={h.id} className="flex gap-3 text-sm">
                      <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-brand-500" />
                      <div>
                        <p className="font-semibold text-slate-900">{dict.statuses[h.newStatus]}</p>
                        {h.oldStatus && (
                          <p className="text-xs text-slate-500">
                            {locale === 'ar' ? 'من: ' : 'From: '}
                            {dict.statuses[h.oldStatus]}
                          </p>
                        )}
                        {h.comment && <p className="text-slate-500 italic">&quot;{h.comment}&quot;</p>}
                        <p className="text-xs text-slate-400">
                          {h.changedBy.fullName} · {fmtDateTime(h.createdAt, locale)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
