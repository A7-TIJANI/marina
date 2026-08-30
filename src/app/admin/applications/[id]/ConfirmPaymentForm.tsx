'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { confirmPaymentAction } from '@/actions/admin';
import type { Dictionary } from '@/lib/i18n';
import { FormField } from '@/components/forms/FormField';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="sm" disabled={pending}>
      {pending ? '…' : label}
    </Button>
  );
}

export function ConfirmPaymentForm({ applicationId, dict }: { applicationId: number; dict: Dictionary }) {
  const [state, action] = useFormState(confirmPaymentAction, { ok: false });

  return (
    <form action={action} className="space-y-3">
      {state.message && (
        <div className={`rounded-lg p-3 text-sm ${state.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
          {state.ok ? '✓ ' : ''}
          {state.message}
        </div>
      )}
      <input type="hidden" name="applicationId" value={applicationId} />

      <div className="grid grid-cols-2 gap-3">
        <FormField label={dict.admin.amount} htmlFor="amount">
          <Input id="amount" name="amount" type="number" step="0.01" min="0" placeholder="0.00" />
        </FormField>
        <FormField label={dict.admin.currency} htmlFor="currency">
          <Select id="currency" name="currency" defaultValue="USD">
            <option value="USD">USD</option>
            <option value="SAR">SAR</option>
            <option value="SDG">SDG</option>
            <option value="EUR">EUR</option>
          </Select>
        </FormField>
      </div>

      <FormField label={dict.admin.comment} htmlFor="payComment">
        <Textarea id="payComment" name="comment" rows={2} maxLength={1000} />
      </FormField>

      <SubmitBtn label={dict.admin.confirmPaymentButton} />
    </form>
  );
}
