import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { Container } from '@/components/ui/Card';
import { Logo } from '@/components/layout/Logo';
import { ResendVerificationForm } from './ResendVerificationForm';

export default function VerifyEmailPage({ searchParams }: { searchParams: { verified?: string; invalid?: string } }) {
  const locale = getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center bg-slate-50 py-12">
      <Container className="max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <Logo className="h-10 w-10 text-lg" />
        </div>
        <h1 className="mb-2 text-2xl font-extrabold text-slate-900">{dict.auth.verifyTitle}</h1>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {searchParams.verified === '1' ? (
            <p className="text-sm font-medium text-emerald-700">✓ {dict.auth.verifySuccess}</p>
          ) : searchParams.invalid === '1' ? (
            <p className="text-sm font-medium text-rose-600">{dict.auth.verifyInvalidToken}</p>
          ) : (
            <p className="text-sm text-slate-600">{dict.auth.verifyPendingBody}</p>
          )}

          <div className="mt-5 border-t border-slate-100 pt-5">
            <ResendVerificationForm dict={dict} />
          </div>
        </div>
      </Container>
    </div>
  );
}
