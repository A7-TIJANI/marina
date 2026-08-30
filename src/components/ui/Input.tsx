import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

export const baseFieldClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50';

export function Input({ className, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={cn(baseFieldClass, error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100', className)}
      {...props}
    />
  );
}
