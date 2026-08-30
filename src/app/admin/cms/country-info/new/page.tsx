import { requireAdmin } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';
import { CountryInfoForm } from '../CountryInfoForm';

export default async function NewCountryInfoPage() {
  await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">{dict.create}</h1>
      <Card>
        <CardBody>
          <CountryInfoForm dict={dict} />
        </CardBody>
      </Card>
    </div>
  );
}
