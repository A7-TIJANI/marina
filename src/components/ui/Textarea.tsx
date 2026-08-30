import { cn } from '@/lib/utils';
import type { TextareaHTMLAttributes } from 'react';
import { baseFieldClass } from './Input';

export function Textarea({ className, error, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return (
    <textarea
      className={cn(baseFieldClass, 'resize-y', error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100', className)}
      {...props}
    />
  );
}
