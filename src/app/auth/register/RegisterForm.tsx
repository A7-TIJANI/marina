'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { registerAction } from '@/actions/auth';
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

export function RegisterForm({ dict }: { dict: Dictionary }) {
  const [state, action] = useFormState(registerAction, initialActionState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-1">
      {state.message && <div className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.message}</div>}

      <FormField label={dict.auth.fullName} htmlFor="fullName" required error={fe.fullName}>
        <Input id="fullName" name="fullName" required maxLength={150} autoComplete="name" error={!!fe.fullName} />
      </FormField>

      <FormField label={dict.auth.email} htmlFor="email" required error={fe.email}>
        <Input id="email" name="email" type="email" required maxLength={150} autoComplete="email" error={!!fe.email} />
      </FormField>

      <FormField label={dict.auth.phone} htmlFor="phone">
        <Input id="phone" name="phone" type="tel" maxLength={30} autoComplete="tel" />
      </FormField>

      <FormField label={dict.auth.password} htmlFor="password" required error={fe.password}>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" error={!!fe.password} />
      </FormField>

      <FormField label={dict.auth.passwordConfirm} htmlFor="passwordConfirm" required error={fe.passwordConfirm}>
        <Input id="passwordConfirm" name="passwordConfirm" type="password" required autoComplete="new-password" error={!!fe.passwordConfirm} />
      </FormField>

      <div className="pt-2">
        <SubmitButton label={dict.auth.registerButton} />
      </div>
    </form>
  );
}
