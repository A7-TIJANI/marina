'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NavLink {
  href: string;
  label: string;
}

export function MobileMenu({
  links,
  authLinks,
}: {
  links: NavLink[];
  authLinks: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Toggle menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </button>

      <div
        className={cn(
          'fixed inset-x-0 top-[var(--nav-h,64px)] z-40 origin-top border-b border-slate-200 bg-white shadow-lg transition-all',
          open ? 'animate-fade-in block' : 'hidden'
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3" onClick={() => setOpen(false)}>
            {authLinks}
          </div>
        </nav>
      </div>
    </div>
  );
}
