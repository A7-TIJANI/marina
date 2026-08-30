import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary, getLocalized } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';
import { statusBadgeClass } from '@/lib/status';
import { Badge } from '@/components/ui/Badge';

export default async function AdminDashboardPage() {
  await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const [totalStudents, totalApplications, pendingPayments, activeUniversities, recent] = await Promise.all([
    prisma.user.count({ where: { role: 'student' } }),
    prisma.application.count(),
    prisma.application.count({ where: { status: 'awaiting_payment' } }),
    prisma.university.count({ where: { isActive: true } }),
    prisma.application.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { fullName: true } },
        university: { select: { name: true } },
      },
    }),
  ]);

  const stats = [
    { label: dict.admin.totalStudents, value: totalStudents },
    { label: dict.admin.totalApplications, value: totalApplications },
    { label: dict.admin.pendingPayments, value: pendingPayments },
    { label: dict.admin.activeUniversities, value: activeUniversities },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">{dict.admin.dashboardTitle}</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-3xl font-extrabold text-slate-900">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">{dict.admin.recentApplications}</h2>
        <Link href="/admin/applications" className="text-sm font-semibold text-brand-700 hover:underline">
          {dict.admin.viewAll} →
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-start font-semibold text-slate-600">{dict.admin.student}</th>
              <th className="px-4 py-3 text-start font-semibold text-slate-600">{dict.student.university}</th>
              <th className="px-4 py-3 text-start font-semibold text-slate-600">{dict.status}</th>
              <th className="px-4 py-3 text-start font-semibold text-slate-600">{dict.student.submitted}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recent.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{app.student.fullName}</td>
                <td className="px-4 py-3 text-slate-700">{getLocalized(app.university.name as { en: string; ar?: string }, locale)}</td>
                <td className="px-4 py-3">
                  <Badge className={statusBadgeClass(app.status)}>{dict.statuses[app.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-500">{fmtDate(app.createdAt, locale)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/applications/${app.id}`} className="text-xs font-semibold text-brand-700 hover:underline">
                    {dict.student.view} →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
