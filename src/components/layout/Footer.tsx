import Link from 'next/link';
import { getDictionary } from '@/lib/i18n';
import { getLocale } from '@/lib/locale';
import { Container } from '@/components/ui/Card';
import { Logo } from './Logo';

export function Footer() {
  const locale = getLocale();
  const dict = getDictionary(locale);

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-900 text-slate-300">
      <Container className="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2 font-extrabold text-white">
            <Logo />
            {dict.siteName}
          </div>
          <p className="text-sm text-slate-400">{dict.footer.builtFor}</p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">{dict.nav.universities}</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/universities" className="hover:text-white">
                {dict.nav.universities}
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white">
                {dict.nav.about}
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white">
                {dict.nav.faq}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">{dict.nav.contact}</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/contact" className="hover:text-white">
                {dict.nav.contact}
              </Link>
            </li>
            <li>
              <a href="https://wa.me/250780000000" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                {dict.public.whatsappCta}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">{dict.nav.login}</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/auth/login" className="hover:text-white">
                {dict.nav.login}
              </Link>
            </li>
            <li>
              <Link href="/auth/register" className="hover:text-white">
                {dict.nav.register}
              </Link>
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {dict.siteName}. {dict.footer.rights}
      </div>
    </footer>
  );
}
