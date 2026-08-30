import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { Container } from '@/components/ui/Card';
import { FaqAccordion } from './FaqAccordion';

export const revalidate = 300;

export default async function FaqPage() {
  const locale = getLocale();
  const dict = getDictionary(locale);

  const faqs = await prisma.faq.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-extrabold text-slate-900">{dict.public.faqTitle}</h1>

      <div className="mt-8 max-w-2xl">
        <FaqAccordion
          faqs={faqs.map((f) => ({
            id: f.id,
            question: f.question as { en: string; ar?: string },
            answer: f.answer as { en: string; ar?: string },
          }))}
          locale={locale}
        />
      </div>

      {faqs.length === 0 && <p className="mt-8 text-slate-500">{dict.noResults}</p>}
    </Container>
  );
}
