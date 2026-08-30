import { cn } from '@/lib/utils';

interface SkeletonProps {
  type?: 'table' | 'card' | 'form';
  rows?: number;
  className?: string;
}

function Bar({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-100', className)} />;
}

/**
 * One parameterized skeleton for the whole app (spec §8.2, §17) — pass
 * `type` to pick the shape instead of importing a different component
 * per page.
 */
export function Skeleton({ type = 'card', rows = 5, className }: SkeletonProps) {
  if (type === 'table') {
    return (
      <div className={cn('rounded-2xl border border-slate-200 bg-white', className)}>
        <div className="border-b border-slate-100 px-4 py-3">
          <Bar className="h-4 w-40" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3">
              <Bar className="h-4 w-1/4" />
              <Bar className="h-4 w-1/3" />
              <Bar className="h-4 w-1/6" />
              <Bar className="h-4 w-1/6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className={cn('rounded-2xl border border-slate-200 bg-white p-5', className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="mb-4">
            <Bar className="mb-1.5 h-3 w-24" />
            <Bar className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  // 'card'
  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-5', className)}>
      <Bar className="mb-3 h-5 w-32" />
      <Bar className="mb-2 h-4 w-full" />
      <Bar className="mb-2 h-4 w-5/6" />
      <Bar className="h-4 w-3/4" />
    </div>
  );
}
