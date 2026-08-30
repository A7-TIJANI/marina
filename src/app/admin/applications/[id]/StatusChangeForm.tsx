'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { changeStatusAction } from '@/actions/admin';
import type { Dictionary } from '@/lib/i18n';
import type { ApplicationStatus } from '@prisma/client';
import { FormField } from '@/components/forms/FormField';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? '…' : label}
    </Button>
  );
}

export function StatusChangeForm({
  applicationId,
  currentStatus,
  availableStatuses,
  dict,
}: {
  applicationId: number;
  currentStatus: ApplicationStatus;
  availableStatuses: ApplicationStatus[];
  dict: Dictionary;
}) {
  const [state, action] = useFormState(changeStatusAction, { ok: false });

  return (
    <form action={action} className="space-y-3">
      {state.message && (
        <div className={`rounded-lg p-3 text-sm ${state.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
          {state.ok ? '✓ ' : ''}
          {state.message}
        </div>
      )}
      <input type="hidden" name="applicationId" value={applicationId} />

      <FormField label={dict.admin.newStatus} htmlFor="newStatus">
        <Select id="newStatus" name="newStatus" defaultValue="">
          <option value="" disabled>
            {dict.admin.newStatus}
          </option>
          {availableStatuses.map((s) => (
            <option key={s} value={s} disabled={s === currentStatus}>
              {dict.statuses[s]}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label={dict.admin.comment} htmlFor="changeComment">
        <Textarea id="changeComment" name="comment" rows={2} maxLength={1000} />
      </FormField>

      <SubmitBtn label={dict.admin.updateStatus} />
    </form>
  );
}
