import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { Container } from '@/components/ui/Card';
import { LogoutButton } from '@/components/layout/LogoutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const navLinks = [
    { href: '/admin/dashboard', label: dict.admin.dashboardTitle },
    { href: '/admin/applications', label: dict.nav.applications },
    { href: '/admin/students', label: dict.nav.students },
    { href: '/admin/cms/universities', label: dict.nav.manageUniversities },
    { href: '/admin/cms/faqs', label: dict.nav.manageFaq },
    { href: '/admin/cms/country-info', label: dict.nav.manageCountryInfo },
  ];

  return (
    <Container className="py-8">
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-3 px-2 text-xs font-bold uppercase tracking-wide text-slate-400">Admin</p>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-slate-100 pt-2">
                <LogoutButton label={dict.nav.logout} className="w-full text-start" />
              </div>
            </nav>
          </div>
        </aside>
        <div>{children}</div>
      </div>
    </Container>
  );
}
