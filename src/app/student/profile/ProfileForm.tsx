'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateProfileAction } from '@/actions/auth';
import { initialActionState } from '@/lib/action-types';
import type { Dictionary } from '@/lib/i18n';
import { FormField } from '@/components/forms/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? '…' : label}
    </Button>
  );
}

export function ProfileForm({
  user,
  dict,
}: {
  user: { fullName: string; email: string; phone: string | null; preferredLang: string };
  dict: Dictionary;
}) {
  const [state, action] = useFormState(updateProfileAction, initialActionState);

  return (
    <form action={action} className="max-w-sm space-y-1">
      {state.ok && <div className="mb-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">✓ {state.message}</div>}
      {!state.ok && state.message && <div className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.message}</div>}

      <FormField label={dict.auth.fullName} htmlFor="fullName" required>
        <Input id="fullName" name="fullName" required defaultValue={user.fullName} maxLength={150} />
      </FormField>

      <FormField label={dict.auth.email} htmlFor="email">
        <Input id="email" value={user.email} disabled className="bg-slate-50 text-slate-500" readOnly />
      </FormField>

      <FormField label={dict.auth.phone} htmlFor="phone">
        <Input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ''} maxLength={30} />
      </FormField>

      <FormField label={dict.student.preferredLanguage} htmlFor="preferredLang">
        <Select id="preferredLang" name="preferredLang" defaultValue={user.preferredLang}>
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </Select>
      </FormField>

      <SubmitButton label={dict.save} />
    </form>
  );
}
