import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary, getLocalized } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';

export default async function AdminFaqsPage() {
  await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const faqs = await prisma.faq.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">{dict.admin.faqTitle}</h1>
        <Link href="/admin/cms/faqs/new">
          <Button size="sm">+ {dict.admin.addFaq}</Button>
        </Link>
      </div>

      <div className="space-y-2">
        {faqs.map((faq) => (
          <div key={faq.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div>
              <p className="font-medium text-slate-900">{getLocalized(faq.question as { en: string; ar?: string }, locale)}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Order: {faq.sortOrder} · {faq.isActive ? 'Active' : 'Hidden'}
              </p>
            </div>
            <Link href={`/admin/cms/faqs/${faq.id}/edit`} className="flex-shrink-0 text-xs font-semibold text-brand-700 hover:underline">
              {dict.edit}
            </Link>
          </div>
        ))}
        {faqs.length === 0 && <p className="text-sm text-slate-500">{dict.noResults}</p>}
      </div>
    </div>
  );
}
