'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { saveFaqAction } from '@/actions/admin';
import type { Dictionary } from '@/lib/i18n';
import { FormField } from '@/components/forms/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? '…' : label}
    </Button>
  );
}

interface FaqData {
  id: number;
  question: { en: string; ar?: string };
  answer: { en: string; ar?: string };
  sortOrder: number;
  isActive: boolean;
}

export function FaqForm({ faq, dict }: { faq?: FaqData; dict: Dictionary }) {
  const [state, action] = useFormState(saveFaqAction, { ok: false });

  return (
    <form action={action} className="max-w-2xl space-y-1">
      {state.message && !state.ok && <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.message}</div>}
      {faq?.id && <input type="hidden" name="id" value={faq.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={dict.admin.questionEn} htmlFor="questionEn" required>
          <Input id="questionEn" name="questionEn" required maxLength={400} defaultValue={faq?.question.en ?? ''} />
        </FormField>
        <FormField label={dict.admin.questionAr} htmlFor="questionAr">
          <Input id="questionAr" name="questionAr" maxLength={400} defaultValue={faq?.question.ar ?? ''} dir="rtl" />
        </FormField>
      </div>

      <FormField label={dict.admin.answerEn} htmlFor="answerEn" required>
        <Textarea id="answerEn" name="answerEn" required rows={4} defaultValue={faq?.answer.en ?? ''} />
      </FormField>

      <FormField label={dict.admin.answerAr} htmlFor="answerAr">
        <Textarea id="answerAr" name="answerAr" rows={4} defaultValue={faq?.answer.ar ?? ''} dir="rtl" />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={dict.admin.sortOrder} htmlFor="sortOrder">
          <Input id="sortOrder" name="sortOrder" type="number" min="0" max="255" defaultValue={String(faq?.sortOrder ?? 0)} />
        </FormField>
        <FormField label={dict.admin.active} htmlFor="isActive">
          <Select id="isActive" name="isActive" defaultValue={String(faq?.isActive ?? true)}>
            <option value="true">{dict.yes}</option>
            <option value="false">{dict.no}</option>
          </Select>
        </FormField>
      </div>

      <div className="flex gap-3 pt-2">
        <SubmitBtn label={dict.save} />
        <Link href="/admin/cms/faqs">
          <Button variant="outline" type="button">
            {dict.cancel}
          </Button>
        </Link>
      </div>
    </form>
  );
}
