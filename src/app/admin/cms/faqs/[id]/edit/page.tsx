import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';
import { FaqForm } from '../../FaqForm';

export default async function EditFaqPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const faq = await prisma.faq.findUnique({ where: { id: parseInt(params.id, 10) } });
  if (!faq) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">{dict.admin.editFaq}</h1>
      <Card>
        <CardBody>
          <FaqForm
            faq={{
              id: faq.id,
              question: faq.question as { en: string; ar?: string },
              answer: faq.answer as { en: string; ar?: string },
              sortOrder: faq.sortOrder,
              isActive: faq.isActive,
            }}
            dict={dict}
          />
        </CardBody>
      </Card>
    </div>
  );
}
