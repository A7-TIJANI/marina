import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';
import { UniversityForm } from '../../UniversityForm';

export default async function EditUniversityPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const university = await prisma.university.findUnique({ where: { id: parseInt(params.id, 10) } });
  if (!university) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">{dict.admin.editUniversity}</h1>
      <Card>
        <CardBody>
          <UniversityForm
            university={{
              id: university.id,
              name: university.name as { en: string; ar?: string },
              description: university.description as { en: string; ar?: string } | null,
              city: university.city,
              websiteUrl: university.websiteUrl,
              imageUrl: university.imageUrl,
              isActive: university.isActive,
            }}
            dict={dict}
          />
        </CardBody>
      </Card>
    </div>
  );
}
