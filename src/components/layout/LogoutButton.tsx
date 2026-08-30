'use client';

import { logoutAction } from '@/actions/auth';
import { cn } from '@/lib/utils';

export function LogoutButton({ label, className }: { label: string; className?: string }) {
  return (
    <form action={logoutAction}>
      <button type="submit" className={cn('rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100', className)}>
        {label}
      </button>
    </form>
  );
}
