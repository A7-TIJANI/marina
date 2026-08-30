import Link from 'next/link';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { Container } from '@/components/ui/Card';
import { Logo } from '@/components/layout/Logo';
import { RegisterForm } from './RegisterForm';

export default function RegisterPage() {
  const locale = getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center bg-slate-50 py-12">
      <Container className="max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo className="h-10 w-10 text-lg" />
        </div>
        <h1 className="mb-1 text-center text-2xl font-extrabold text-slate-900">{dict.auth.registerTitle}</h1>
        <p className="mb-6 text-center text-sm text-slate-500">{dict.auth.registerSubtitle}</p>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <RegisterForm dict={dict} />
        </div>

        <p className="mt-4 text-center text-sm text-slate-600">
          {dict.auth.haveAccount}{' '}
          <Link href="/auth/login" className="font-semibold text-brand-700 hover:underline">
            {dict.auth.loginLink}
          </Link>
        </p>
      </Container>
    </div>
  );
}
