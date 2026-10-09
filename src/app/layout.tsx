import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { getLocale } from '@/lib/locale';
import { getDictionary } from '@/lib/i18n';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui/ToastProvider';
import './globals.css';

const cairo = Cairo({
  subsets: ['latin', 'arabic'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Marina — Study in Rwanda',
  description: 'Your trusted path to studying at Rwandan universities.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const dict = getDictionary(locale);

  return (
    <html lang={locale} dir={dict.dir}>
      <body className={`${cairo.variable} min-h-screen bg-white font-sans text-slate-900 antialiased`}>
        <Navbar />
        <main id="main-content">{children}</main>
        <Footer />
        <ToastProvider />
      </body>
    </html>
  );
}
