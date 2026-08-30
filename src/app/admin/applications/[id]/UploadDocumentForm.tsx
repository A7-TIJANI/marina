'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { uploadAdminDocumentAction } from '@/actions/documents';
import type { Dictionary } from '@/lib/i18n';
import { FormField } from '@/components/forms/FormField';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? '…' : label}
    </Button>
  );
}

export function UploadDocumentForm({ applicationId, dict }: { applicationId: number; dict: Dictionary }) {
  const [state, action] = useFormState(uploadAdminDocumentAction, { ok: false });

  return (
    <form action={action} className="space-y-3" encType="multipart/form-data">
      {state.message && (
        <div className={`rounded-lg p-3 text-sm ${state.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
          {state.ok ? '✓ ' : ''}
          {state.message}
        </div>
      )}
      <input type="hidden" name="applicationId" value={applicationId} />

      <FormField label={dict.admin.labelEn} htmlFor="labelEn" required>
        <Input id="labelEn" name="labelEn" required maxLength={200} />
      </FormField>

      <FormField label={dict.admin.labelAr} htmlFor="labelAr">
        <Input id="labelAr" name="labelAr" maxLength={200} dir="rtl" />
      </FormField>

      <FormField label={dict.admin.file} htmlFor="file" required>
        <input
          id="file"
          name="file"
          type="file"
          accept="application/pdf"
          required
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
        />
      </FormField>

      <SubmitBtn label={dict.admin.uploadButton} />
    </form>
  );
}
