import Link from 'next/link';
import { requireStudent } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { Container } from '@/components/ui/Card';
import { LogoutButton } from '@/components/layout/LogoutButton';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStudent();
  const locale = getLocale();
  const dict = getDictionary(locale);

  const navLinks = [
    { href: '/student/dashboard', label: dict.nav.myApplications },
    { href: '/student/applications/new', label: dict.student.newApplication },
    { href: '/student/profile', label: dict.nav.profile },
  ];

  return (
    <Container className="py-8">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-4 truncate px-2 text-sm font-bold text-slate-900">{session.fullName}</p>
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
