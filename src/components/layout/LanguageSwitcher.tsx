'use client';

import { usePathname } from 'next/navigation';
import { switchLocale } from '@/actions/locale';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();

  return (
    <form action={switchLocale} className="flex items-center gap-1">
      <input type="hidden" name="pathname" value={pathname} />
      {(['en', 'ar'] as Locale[]).map((loc) => (
        <button
          key={loc}
          type="submit"
          name="locale"
          value={loc}
          aria-current={current === loc}
          className={cn(
            'rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide transition-colors',
            current === loc ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100'
          )}
        >
          {loc === 'en' ? 'EN' : 'AR'}
        </button>
      ))}
    </form>
  );
}
