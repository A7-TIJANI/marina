import { cn } from '@/lib/utils';

/** Simple text mark replacing the old HillsLogo SVG (spec §17). */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-black text-white',
        className
      )}
      aria-hidden="true"
    >
      M
    </span>
  );
}
