'use client';

import { useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { getLocalized } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface FaqRow {
  id: number;
  question: { en: string; ar?: string };
  answer: { en: string; ar?: string };
}

export function FaqAccordion({ faqs, locale }: { faqs: FaqRow[]; locale: Locale }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
      {faqs.map((faq) => {
        const isOpen = open === faq.id;
        return (
          <div key={faq.id}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : faq.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              {getLocalized(faq.question, locale)}
              <span className={cn('flex-shrink-0 text-brand-600 transition-transform', isOpen && 'rotate-45')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </button>
            {isOpen && <div className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{getLocalized(faq.answer, locale)}</div>}
          </div>
        );
      })}
    </div>
  );
}
