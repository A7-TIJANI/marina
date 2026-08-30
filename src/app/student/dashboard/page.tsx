import Link from 'next/link';
import { requireStudent } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary, interpolate, getLocalized } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';
import { statusBadgeClass } from '@/lib/status';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function StudentDashboardPage() {
  const session = await requireStudent();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const applications = await prisma.application.findMany({
    where: { studentId: session.userId },
    include: { university: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {interpolate(dict.student.dashboardTitle, { name: session.fullName.split(' ')[0]! })}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">{dict.student.dashboardSubtitle}</p>
        </div>
        <Link href="/student/applications/new">
          <Button size="sm">+ {dict.student.newApplication}</Button>
        </Link>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <p className="mb-4 text-slate-500">{dict.student.noApplications}</p>
            <Link href="/student/applications/new">
              <Button size="sm">{dict.student.startApplication}</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-start font-semibold text-slate-600">{dict.student.university}</th>
                <th className="px-4 py-3 text-start font-semibold text-slate-600">{dict.student.programme}</th>
                <th className="px-4 py-3 text-start font-semibold text-slate-600">{dict.status}</th>
                <th className="px-4 py-3 text-start font-semibold text-slate-600">{dict.student.submitted}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {getLocalized(app.university.name as { en: string; ar?: string }, locale)}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-slate-700">{app.desiredProgramme}</td>
                  <td className="px-4 py-3">
                    <Badge className={statusBadgeClass(app.status)}>{dict.statuses[app.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{fmtDate(app.createdAt, locale)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/student/applications/${app.id}`} className="text-xs font-semibold text-brand-700 hover:underline">
                      {dict.student.view} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
