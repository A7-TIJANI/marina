'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { resendVerificationAction } from '@/actions/auth';
import { initialActionState } from '@/lib/action-types';
import type { Dictionary } from '@/lib/i18n';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending} variant="outline" fullWidth>
      {pending ? '…' : label}
    </Button>
  );
}

export function ResendVerificationForm({ dict }: { dict: Dictionary }) {
  const [state, action] = useFormState(resendVerificationAction, initialActionState);

  if (state.ok) {
    return <p className="text-sm text-emerald-700">{dict.auth.resendVerificationSent}</p>;
  }

  return (
    <form action={action} className="space-y-2">
      <Input name="email" type="email" placeholder={dict.auth.email} required maxLength={150} />
      <SubmitButton label={dict.auth.resendVerification} />
    </form>
  );
}
