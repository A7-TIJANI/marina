import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { fmtDate } from '@/lib/utils';

const PAGE_SIZE = 20;

interface Props {
  searchParams: { page?: string };
}

export default async function AdminStudentsPage({ searchParams }: Props) {
  await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'student' },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where: { role: 'student' } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">{dict.admin.studentsTitle}</h1>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-start font-semibold text-slate-600">{dict.auth.fullName}</th>
              <th className="px-4 py-3 text-start font-semibold text-slate-600">{dict.auth.email}</th>
              <th className="px-4 py-3 text-start font-semibold text-slate-600">{dict.auth.phone}</th>
              <th className="px-4 py-3 text-start font-semibold text-slate-600">{dict.nav.applications}</th>
              <th className="px-4 py-3 text-start font-semibold text-slate-600">Joined</th>
              <th className="px-4 py-3 text-start font-semibold text-slate-600">Verified</th>
              <th className="px-4 py-3 text-start font-semibold text-slate-600">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{s.fullName}</td>
                <td className="px-4 py-3 text-slate-600">{s.email}</td>
                <td className="px-4 py-3 text-slate-500">{s.phone ?? '—'}</td>
                <td className="px-4 py-3 text-slate-700">{s._count.applications}</td>
                <td className="px-4 py-3 text-slate-500">{fmtDate(s.createdAt, locale)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block h-2 w-2 rounded-full ${s.emailVerified ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block h-2 w-2 rounded-full ${s.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && <p className="py-8 text-center text-sm text-slate-500">{dict.noResults}</p>}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <Link
            href={`/admin/students?page=${Math.max(1, page - 1)}`}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-slate-300 px-3 py-1.5 font-semibold ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'}`}
          >
            {dict.admin.previous}
          </Link>
          <span>
            {dict.admin.page} {page} {dict.admin.of} {totalPages}
          </span>
          <Link
            href={`/admin/students?page=${Math.min(totalPages, page + 1)}`}
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
