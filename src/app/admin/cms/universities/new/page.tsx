import { requireAdmin } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';
import { UniversityForm } from '../UniversityForm';

export default async function NewUniversityPage() {
  await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">{dict.admin.addUniversity}</h1>
      <Card>
        <CardBody>
          <UniversityForm dict={dict} />
        </CardBody>
      </Card>
    </div>
  );
}
