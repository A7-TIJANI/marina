'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { saveCountryInfoAction } from '@/actions/admin';
import type { Dictionary } from '@/lib/i18n';
import { FormField } from '@/components/forms/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? '…' : label}
    </Button>
  );
}

interface CountryInfoData {
  id: number;
  sectionKey: string;
  title: { en: string; ar?: string };
  content: { en: string; ar?: string };
  sortOrder: number;
}

export function CountryInfoForm({ section, dict }: { section?: CountryInfoData; dict: Dictionary }) {
  const [state, action] = useFormState(saveCountryInfoAction, { ok: false });

  return (
    <form action={action} className="max-w-2xl space-y-1">
      {state.message && !state.ok && <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.message}</div>}
      {section?.id && <input type="hidden" name="id" value={section.id} />}

      <FormField label="Section Key" htmlFor="sectionKey" required hint="URL-safe identifier, e.g. 'overview'. Cannot be changed once created.">
        <Input id="sectionKey" name="sectionKey" required maxLength={80} defaultValue={section?.sectionKey ?? ''} readOnly={!!section?.id} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={dict.admin.sectionTitleEn} htmlFor="sectionTitleEn" required>
          <Input id="sectionTitleEn" name="sectionTitleEn" required maxLength={200} defaultValue={section?.title.en ?? ''} />
        </FormField>
        <FormField label={dict.admin.sectionTitleAr} htmlFor="sectionTitleAr">
          <Input id="sectionTitleAr" name="sectionTitleAr" maxLength={200} defaultValue={section?.title.ar ?? ''} dir="rtl" />
        </FormField>
      </div>

      <FormField label={dict.admin.contentEn} htmlFor="contentEn" required>
        <Textarea id="contentEn" name="contentEn" required rows={6} defaultValue={section?.content.en ?? ''} />
      </FormField>

      <FormField label={dict.admin.contentAr} htmlFor="contentAr">
        <Textarea id="contentAr" name="contentAr" rows={6} defaultValue={section?.content.ar ?? ''} dir="rtl" />
      </FormField>

      <FormField label={dict.admin.sortOrder} htmlFor="sortOrder">
        <Input id="sortOrder" name="sortOrder" type="number" min="0" max="255" defaultValue={String(section?.sortOrder ?? 0)} className="max-w-[120px]" />
      </FormField>

      <div className="flex gap-3 pt-2">
        <SubmitBtn label={dict.save} />
        <Link href="/admin/cms/country-info">
          <Button variant="outline" type="button">
            {dict.cancel}
          </Button>
        </Link>
      </div>
    </form>
  );
}
