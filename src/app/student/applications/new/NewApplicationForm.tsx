'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { createApplicationAction } from '@/actions/student';
import type { Dictionary } from '@/lib/i18n';
import { FormField } from '@/components/forms/FormField';
import { Select } from '@/components/ui/Select';
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

export function NewApplicationForm({ universities, dict }: { universities: { id: number; label: string }[]; dict: Dictionary }) {
  const [state, action] = useFormState(createApplicationAction, { ok: false });

  return (
    <form action={action} className="space-y-1">
      {state.message && <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.message}</div>}

      <FormField label={dict.nav.universities} htmlFor="universityId" required>
        <Select id="universityId" name="universityId" required>
          <option value="">{dict.student.selectUniversity}</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label={dict.student.desiredProgramme} htmlFor="desiredProgramme" required>
        <Input id="desiredProgramme" name="desiredProgramme" required maxLength={255} placeholder={dict.student.desiredProgrammePlaceholder} />
      </FormField>

      <FormField label={dict.student.notes} htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} maxLength={2000} placeholder={dict.student.notesPlaceholder} />
      </FormField>

      <div className="flex flex-col gap-2 pt-2">
        <SubmitButton label={dict.submit} />
        <Link href="/student/dashboard">
          <Button variant="outline" fullWidth type="button">
            {dict.cancel}
          </Button>
        </Link>
      </div>
    </form>
  );
}
