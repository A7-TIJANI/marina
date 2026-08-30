import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary, getLocalized } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';

export default async function AdminCountryInfoPage() {
  await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);
  const sections = await prisma.countryInfo.findMany({ orderBy: { sortOrder: 'asc' } });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">{dict.admin.countryInfoTitle}</h1>
        <Link href="/admin/cms/country-info/new">
          <Button size="sm">+ {dict.create}</Button>
        </Link>
      </div>
      <div className="space-y-2">
        {sections.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div>
              <p className="font-medium text-slate-900">{getLocalized(s.title as { en: string; ar?: string }, locale)}</p>
              <p className="text-xs text-slate-400">
                Key: {s.sectionKey} · Order: {s.sortOrder}
              </p>
            </div>
            <Link href={`/admin/cms/country-info/${s.id}/edit`} className="text-xs font-semibold text-brand-700 hover:underline">
              {dict.edit}
            </Link>
          </div>
        ))}
        {sections.length === 0 && <p className="text-sm text-slate-500">{dict.noResults}</p>}
      </div>
    </div>
  );
}
