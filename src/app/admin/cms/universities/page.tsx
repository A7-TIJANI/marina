import Link from 'next/link';
import Image from 'next/image';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary, getLocalized } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';

export default async function AdminUniversitiesPage() {
  await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const universities = await prisma.university.findMany({ orderBy: { id: 'asc' } });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">{dict.admin.universitiesTitle}</h1>
        <Link href="/admin/cms/universities/new">
          <Button size="sm">+ {dict.admin.addUniversity}</Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-start font-semibold text-slate-600">Image</th>
              <th className="px-4 py-3 text-start font-semibold text-slate-600">{dict.admin.nameEn}</th>
              <th className="px-4 py-3 text-start font-semibold text-slate-600">{dict.admin.city}</th>
              <th className="px-4 py-3 text-start font-semibold text-slate-600">{dict.admin.active}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {universities.map((u) => {
              const name = getLocalized(u.name as { en: string; ar?: string }, locale);
              return (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <div className="relative h-12 w-20 overflow-hidden rounded-lg bg-brand-800">
                      {u.imageUrl ? (
                        <Image src={u.imageUrl} alt={name} fill className="object-cover" sizes="80px" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <svg viewBox="0 0 120 60" className="w-10 opacity-30" aria-hidden="true">
                            <path d="M0 50 L20 25 L35 40 L55 10 L75 35 L95 20 L120 30 L120 60 L0 60 Z" fill="white" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.city}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block h-2 w-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/cms/universities/${u.id}/edit`} className="text-xs font-semibold text-brand-700 hover:underline">
                      {dict.edit}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
