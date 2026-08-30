'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { submitContactAction } from '@/actions/contact';
import type { Dictionary, Locale } from '@/lib/i18n';
import { FormField } from '@/components/forms/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} fullWidth>
      {pending ? '…' : label}
    </Button>
  );
}

export function ContactForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [state, action] = useFormState(submitContactAction, { ok: false });

  if (state.ok) {
    return <div className="rounded-xl bg-emerald-50 p-6 text-center text-sm text-emerald-800">✓ {dict.public.messageSent}</div>;
  }

  return (
    <form action={action} className="space-y-1">
      {state.message && <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.message}</div>}

      <FormField label={dict.public.yourName} htmlFor="senderName" required>
        <Input id="senderName" name="senderName" required maxLength={150} autoComplete="name" />
      </FormField>

      <FormField label={dict.public.yourEmail} htmlFor="senderEmail" required>
        <Input id="senderEmail" name="senderEmail" type="email" required maxLength={150} autoComplete="email" />
      </FormField>

      <FormField label={dict.public.yourMessage} htmlFor="message" required>
        <Textarea id="message" name="message" rows={5} required maxLength={4000} />
      </FormField>

      <SubmitButton label={dict.public.sendMessage} />
    </form>
  );
}
