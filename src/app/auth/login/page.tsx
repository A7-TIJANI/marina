import Link from 'next/link';
import { getLocale } from '@/lib/locale';

export const dynamic = 'force-dynamic';
import { getDictionary } from '@/lib/i18n';
import { Container } from '@/components/ui/Card';
import { Logo } from '@/components/layout/Logo';
import { LoginForm } from './LoginForm';

export default function LoginPage({ searchParams }: { searchParams: { verified?: string } }) {
  const locale = getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center bg-slate-50 py-12">
      <Container className="max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo className="h-10 w-10 text-lg" />
        </div>
        <h1 className="mb-1 text-center text-2xl font-extrabold text-slate-900">{dict.auth.loginTitle}</h1>
        <p className="mb-6 text-center text-sm text-slate-500">{dict.auth.loginSubtitle}</p>

        {searchParams.verified === '1' && (
          <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-center text-sm text-emerald-700">✓ {dict.auth.verifySuccess}</div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <LoginForm dict={dict} />
        </div>

        <p className="mt-4 text-center text-sm text-slate-600">
          {dict.auth.noAccount}{' '}
          <Link href="/auth/register" className="font-semibold text-brand-700 hover:underline">
            {dict.auth.registerLink}
          </Link>
        </p>
      </Container>
    </div>
  );
}
