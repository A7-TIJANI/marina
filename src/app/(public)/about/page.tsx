import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary, getLocalized } from '@/lib/i18n';
import { Container } from '@/components/ui/Card';

export const revalidate = 300;

export default async function AboutPage() {
  const locale = getLocale();
  const dict = getDictionary(locale);

  const sections = await prisma.countryInfo.findMany({ orderBy: { sortOrder: 'asc' } });

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-extrabold text-slate-900">{dict.public.aboutTitle}</h1>

      <div className="mt-8 space-y-10">
        {sections.map((section, i) => {
          const title = getLocalized(section.title as { en: string; ar?: string }, locale);
          const content = getLocalized(section.content as { en: string; ar?: string }, locale);
          return (
            <div key={section.id} className="grid gap-6 lg:grid-cols-[1fr_2fr]">
              <div>
                {i === 0 && <div className="mb-4 h-1 w-12 rounded-full bg-amber-400" />}
                <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
              </div>
              <div className="prose-content text-slate-600">
                {content
                  .split('\n')
                  .filter(Boolean)
                  .map((para, j) => (
                    <p key={j}>{para}</p>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {sections.length === 0 && <p className="mt-8 text-slate-500">{dict.noResults}</p>}
    </Container>
  );
}
