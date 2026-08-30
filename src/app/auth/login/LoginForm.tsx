'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from '@/actions/auth';
import { initialActionState } from '@/lib/action-types';
import type { Dictionary } from '@/lib/i18n';
import { FormField } from '@/components/forms/FormField';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} fullWidth>
      {pending ? '…' : label}
    </Button>
  );
}

export function LoginForm({ dict }: { dict: Dictionary }) {
  const [state, action] = useFormState(loginAction, initialActionState);

  return (
    <form action={action} className="space-y-1">
      {state.message && <div className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.message}</div>}

      <FormField label={dict.auth.email} htmlFor="email" required>
        <Input id="email" name="email" type="email" required autoComplete="email" maxLength={150} />
      </FormField>

      <FormField label={dict.auth.password} htmlFor="password" required>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </FormField>

      <div className="pt-2">
        <SubmitButton label={dict.auth.loginButton} />
      </div>
    </form>
  );
}
