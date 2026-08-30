import { requireStudent } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { ProfileForm } from './ProfileForm';
import { PasswordForm } from './PasswordForm';

export default async function ProfilePage() {
  const session = await requireStudent();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: { fullName: true, email: true, phone: true, preferredLang: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">{dict.student.profileTitle}</h1>

      <Card>
        <CardHeader>{dict.student.profileTitle}</CardHeader>
        <CardBody>
          <ProfileForm user={user} dict={dict} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>{dict.auth.changePasswordTitle}</CardHeader>
        <CardBody>
          <PasswordForm dict={dict} />
        </CardBody>
      </Card>
    </div>
  );
}
