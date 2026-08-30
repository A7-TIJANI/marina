import Link from 'next/link';
import { requireStudent } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary, getLocalized } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';
import { NewApplicationForm } from './NewApplicationForm';

export default async function NewApplicationPage() {
  await requireStudent();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const universities = await prisma.university.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
    select: { id: true, name: true, city: true },
  });

  const uniOptions = universities.map((u) => ({
    id: u.id,
    label: `${getLocalized(u.name as { en: string; ar?: string }, locale)} — ${u.city}`,
  }));

  return (
    <div>
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/student/dashboard" className="hover:text-slate-900">
          {dict.nav.myApplications}
        </Link>
        <span>›</span>
        <span>{dict.student.newApplication}</span>
      </nav>

      <div className="mx-auto max-w-lg">
        <h1 className="mb-1 text-2xl font-extrabold text-slate-900">{dict.student.newAppTitle}</h1>
        <p className="mb-6 text-sm text-slate-500">{dict.student.newAppSubtitle}</p>

        <Card>
          <CardBody>
            <NewApplicationForm universities={uniOptions} dict={dict} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
