import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';
import { CountryInfoForm } from '../../CountryInfoForm';

export default async function EditCountryInfoPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const section = await prisma.countryInfo.findUnique({ where: { id: parseInt(params.id, 10) } });
  if (!section) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">{dict.edit}</h1>
      <Card>
        <CardBody>
          <CountryInfoForm
            section={{
              id: section.id,
              sectionKey: section.sectionKey,
              title: section.title as { en: string; ar?: string },
              content: section.content as { en: string; ar?: string },
              sortOrder: section.sortOrder,
            }}
            dict={dict}
          />
        </CardBody>
      </Card>
    </div>
  );
}
