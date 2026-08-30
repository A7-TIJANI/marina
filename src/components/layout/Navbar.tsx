import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { Container } from '@/components/ui/Card';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileMenu } from './MobileMenu';
import { Logo } from './Logo';
import { LogoutButton } from './LogoutButton';

export async function Navbar() {
  const [session, locale] = await Promise.all([getSession(), Promise.resolve(getLocale())]);
  const dict = getDictionary(locale);

  const publicLinks = [
    { href: '/', label: dict.nav.home },
    { href: '/universities', label: dict.nav.universities },
    { href: '/about', label: dict.nav.about },
    { href: '/faq', label: dict.nav.faq },
    { href: '/contact', label: dict.nav.contact },
  ];

  const dashboardHref = session?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';

  return (
    <header
      className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur"
      style={{ '--nav-h': '64px' } as React.CSSProperties}
    >
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-slate-900">
          <Logo />
          <span className="text-lg">{dict.siteName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher current={locale} />
          {session ? (
            <>
              {/* Plain <a>, not <Link>: this goes to an auth-gated route, and a
                  stale client-side prefetch of it (taken while logged out, before
                  the session cookie existed) can otherwise serve a cached
                  redirect-to-login instead of a fresh request with the cookie. */}
              <a href={dashboardHref} className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                {dict.nav.dashboard}
              </a>
              <LogoutButton label={dict.nav.logout} />
            </>
          ) : (
            <>
              <Link href="/auth/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                {dict.nav.login}
              </Link>
              <Link href="/auth/register" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                {dict.nav.register}
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher current={locale} />
          <MobileMenu
            links={publicLinks}
            authLinks={
              session ? (
                <>
                  <a href={dashboardHref} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-700">
                    {dict.nav.dashboard}
                  </a>
                  <LogoutButton label={dict.nav.logout} className="text-start" />
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700">
                    {dict.nav.login}
                  </Link>
                  <Link href="/auth/register" className="rounded-lg bg-brand-600 px-3 py-2.5 text-center text-sm font-semibold text-white">
                    {dict.nav.register}
                  </Link>
                </>
              )
            }
          />
        </div>
      </Container>
    </header>
  );
}
