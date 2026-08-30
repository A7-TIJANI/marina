import Link from 'next/link';
import { getLocale } from '@/lib/locale';
import { Container } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/layout/Logo';

export default function NotFound() {
  const locale = getLocale();

  return (
    <Container className="flex min-h-[calc(100vh-9rem)] flex-col items-center justify-center py-20 text-center">
      <Logo className="mb-6 h-16 w-16 text-3xl" />
      <h1 className="text-6xl font-extrabold text-slate-200">404</h1>
      <p className="mt-3 text-lg font-semibold text-slate-700">{locale === 'ar' ? 'الصفحة غير موجودة' : 'Page not found'}</p>
      <p className="mt-2 text-sm text-slate-500">
        {locale === 'ar'
          ? 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.'
          : "Sorry, the page you're looking for doesn't exist or has been moved."}
      </p>
      <div className="mt-8">
        <Link href="/">
          <Button>{locale === 'ar' ? 'العودة للرئيسية' : 'Go home'}</Button>
        </Link>
      </div>
    </Container>
  );
}
