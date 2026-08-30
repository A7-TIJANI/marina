'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Card';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <Container className="flex min-h-screen flex-col items-center justify-center py-20 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500">
            An unexpected error occurred. Please try again.
            {error.digest && (
              <span className="mt-1 block text-xs text-slate-400">Error ID: {error.digest}</span>
            )}
          </p>
          <div className="mt-6">
            <Button onClick={reset}>Try again</Button>
          </div>
        </Container>
      </body>
    </html>
  );
}
