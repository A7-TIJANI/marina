import { requireAdmin } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';
import { FaqForm } from '../FaqForm';

export default async function NewFaqPage() {
  await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">{dict.admin.addFaq}</h1>
      <Card>
        <CardBody>
          <FaqForm dict={dict} />
        </CardBody>
      </Card>
    </div>
  );
}
