import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary, getLocalized } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';
import { statusBadgeClass, ALL_STATUSES } from '@/lib/status';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import type { ApplicationStatus, Prisma } from '@prisma/client';

const PAGE_SIZE = 20;

interface Props {
  searchParams: { status?: string; q?: string; page?: string };
}

export default async function AdminApplicationsPage({ searchParams }: Props) {
  await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const statusFilter = ALL_STATUSES.includes(searchParams.status as ApplicationStatus)
    ? (searchParams.status as ApplicationStatus)
    : undefined;

  const query = (searchParams.q ?? '').trim();
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);

  const where: Prisma.ApplicationWhereInput = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(query
      ? {
          OR: [
            { desiredProgramme: { contains: query, mode: 'insensitive' } },
            { student: { fullName: { contains: query, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { fullName: true } },
        university: { select: { name: true } },
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.application.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (query) params.set('q', query);
    params.set('page', String(p));
    return `/admin/applications?${params.toString()}`;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">{dict.admin.applicationsTitle}</h1>

      <form method="get" className="mb-4 max-w-sm">
        {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
        <Input name="q" defaultValue={query} placeholder={dict.admin.search} />
      </form>

      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          href="/admin/applications"
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
            !statusFilter ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'
          }`}
        >
          {dict.admin.allStatuses}
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/applications?status=${s}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
              statusFilter === s ? 'bg-slate-900 text-white ring-slate-900' : `${statusBadgeClass(s)} hover:opacity-80`
            }`}
          >
            {dict.statuses[s]}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-start font-semibold text-slate-600">#</th>
              <th className="px-4 py-3 text-start font-semibold text-slate-600">{dict.admin.student}</th>
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
                <td className="px-4 py-3 text-slate-400">#{app.id}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{app.student.fullName}</td>
                <td className="px-4 py-3 text-slate-700">{getLocalized(app.university.name as { en: string; ar?: string }, locale)}</td>
                <td className="max-w-[160px] truncate px-4 py-3 text-slate-700">{app.desiredProgramme}</td>
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
        {applications.length === 0 && <p className="py-8 text-center text-sm text-slate-500">{dict.noResults}</p>}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <Link
            href={pageHref(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-slate-300 px-3 py-1.5 font-semibold ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'}`}
          >
            {dict.admin.previous}
          </Link>
          <span>
            {dict.admin.page} {page} {dict.admin.of} {totalPages}
          </span>
          <Link
            href={pageHref(Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={`rounded-lg border border-slate-300 px-3 py-1.5 font-semibold ${page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'}`}
          >
            {dict.admin.next}
          </Link>
        </div>
      )}
    </div>
  );
}
