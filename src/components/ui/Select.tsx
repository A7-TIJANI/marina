import { cn } from '@/lib/utils';
import type { SelectHTMLAttributes } from 'react';
import { baseFieldClass } from './Input';

export function Select({ className, error, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return <select className={cn(baseFieldClass, 'cursor-pointer', error && 'border-rose-400', className)} {...props} />;
}
