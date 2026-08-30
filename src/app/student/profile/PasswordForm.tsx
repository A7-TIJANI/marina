'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { changePasswordAction } from '@/actions/auth';
import { initialActionState } from '@/lib/action-types';
import type { Dictionary } from '@/lib/i18n';
import { FormField } from '@/components/forms/FormField';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? '…' : label}
    </Button>
  );
}

export function PasswordForm({ dict }: { dict: Dictionary }) {
  const [state, action] = useFormState(changePasswordAction, initialActionState);
  const router = useRouter();

  // Changing the password bumps token_version and clears the session
  // cookie server-side (spec §5.3), so send the user to log in again.
  useEffect(() => {
    if (state.ok) {
      const t = setTimeout(() => router.push('/auth/login'), 1500);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  return (
    <form action={action} className="max-w-sm space-y-1">
      {state.ok && <div className="mb-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">✓ {state.message}</div>}
      {!state.ok && state.message && <div className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.message}</div>}

      <FormField label={dict.auth.currentPassword} htmlFor="currentPassword" required>
        <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
      </FormField>

      <FormField label={dict.auth.newPassword} htmlFor="newPassword" required>
        <Input id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
      </FormField>

      <FormField label={dict.auth.newPasswordConfirm} htmlFor="newPasswordConfirm" required>
        <Input id="newPasswordConfirm" name="newPasswordConfirm" type="password" required autoComplete="new-password" />
      </FormField>

      <SubmitButton label={dict.auth.changePasswordTitle} />
    </form>
  );
}
