import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStudent } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary, getLocalized } from '@/lib/i18n';
import { fmtDate, fmtDateTime } from '@/lib/utils';
import { statusBadgeClass } from '@/lib/status';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { DocumentUploader } from '@/components/upload/DocumentUploader';
import { DocumentViewer } from '@/components/upload/DocumentViewer';

interface Props {
  params: { id: string };
  searchParams: { created?: string };
}

export default async function StudentApplicationDetailPage({ params, searchParams }: Props) {
  const session = await requireStudent();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const appId = parseInt(params.id, 10);
  if (isNaN(appId)) notFound();

  const app = await prisma.application.findFirst({
    where: { id: appId, studentId: session.userId },
    include: { university: true, paymentConfirmedBy: { select: { fullName: true } } },
  });

  if (!app) notFound();

  const [history, documents] = await Promise.all([
    prisma.applicationHistory.findMany({
      where: { applicationId: appId },
      include: { changedBy: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.document.findMany({ where: { applicationId: appId }, orderBy: { createdAt: 'desc' } }),
  ]);

  const passport = documents.find((d) => d.documentType === 'passport_photo') ?? null;
  const diploma = documents.find((d) => d.documentType === 'secondary_diploma') ?? null;
  const adminDocs = documents.filter((d) => d.documentType === 'admin_document');

  const universityName = getLocalized(app.university.name as { en: string; ar?: string }, locale);

  return (
    <div>
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/student/dashboard" className="hover:text-slate-900">
          {dict.nav.myApplications}
        </Link>
        <span>›</span>
        <span>{universityName}</span>
      </nav>

      {searchParams.created && (
        <div className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">✓ {dict.student.applicationCreated}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Main */}
        <div className="space-y-5">
          <Card>
            <CardHeader>{dict.student.applicationDetail}</CardHeader>
            <CardBody>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <dt className="font-semibold text-slate-600">{dict.student.university}</dt>
                <dd className="text-slate-900">{universityName}</dd>

                <dt className="font-semibold text-slate-600">{dict.student.programme}</dt>
                <dd className="text-slate-900">{app.desiredProgramme}</dd>

                <dt className="font-semibold text-slate-600">{dict.status}</dt>
                <dd>
                  <Badge className={statusBadgeClass(app.status)}>{dict.statuses[app.status]}</Badge>
                </dd>

                <dt className="font-semibold text-slate-600">{dict.student.submitted}</dt>
                <dd className="text-slate-900">{fmtDate(app.createdAt, locale)}</dd>

                {app.notes && (
                  <>
                    <dt className="font-semibold text-slate-600">{dict.student.notes}</dt>
                    <dd className="text-slate-900">{app.notes}</dd>
                  </>
                )}
              </dl>
            </CardBody>
          </Card>

          {/* Required Documents — spec §8.3 */}
          <Card>
            <CardHeader>{dict.student.requiredDocuments}</CardHeader>
            <DocumentUploader
              applicationId={app.id}
              documentType="passport_photo"
              existingDoc={
                passport
                  ? {
                      id: passport.id,
                      fileUrl: passport.fileUrl,
                      fileSizeKb: passport.fileSizeKb,
                      mimeType: passport.mimeType,
                      isVerified: passport.isVerified,
                      createdAt: passport.createdAt.toISOString(),
                    }
                  : null
              }
              dict={dict}
              locale={locale}
            />
            <DocumentUploader
              applicationId={app.id}
              documentType="secondary_diploma"
              existingDoc={
                diploma
                  ? {
                      id: diploma.id,
                      fileUrl: diploma.fileUrl,
                      fileSizeKb: diploma.fileSizeKb,
                      mimeType: diploma.mimeType,
                      isVerified: diploma.isVerified,
                      createdAt: diploma.createdAt.toISOString(),
                    }
                  : null
              }
              dict={dict}
              locale={locale}
            />
            <div className="px-5 py-3 text-xs text-slate-500">ℹ️ {dict.student.documentsHint}</div>
          </Card>

          {/* Payment status */}
          {app.paymentConfirmedAt ? (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
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
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">ℹ️ {dict.student.paymentPendingNotice}</div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card>
            <CardHeader>{dict.student.adminDocumentsTitle}</CardHeader>
            <DocumentViewer
              documents={adminDocs.map((d) => ({
                id: d.id,
                label: d.label as { en: string; ar?: string } | null,
                fileUrl: d.fileUrl,
                fileSizeKb: d.fileSizeKb,
                createdAt: d.createdAt.toISOString(),
              }))}
              dict={dict}
              locale={locale}
            />
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
