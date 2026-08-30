'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { saveUniversityAction } from '@/actions/admin';
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

interface UniversityData {
  id: number;
  name: { en: string; ar?: string };
  description: { en: string; ar?: string } | null;
  city: string;
  websiteUrl: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

export function UniversityForm({ university, dict }: { university?: UniversityData; dict: Dictionary }) {
  const [state, action] = useFormState(saveUniversityAction, { ok: false });

  const [preview, setPreview] = useState<string | null>(university?.imageUrl ?? null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRemoveImage(false);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemove() {
    setPreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <form action={action} className="max-w-2xl space-y-1" encType="multipart/form-data">
      {state.message && !state.ok && <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.message}</div>}
      {university?.id && <input type="hidden" name="id" value={university.id} />}
      <input type="hidden" name="removeImage" value={String(removeImage)} />

      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold text-slate-700">
          University Cover Image
          <span className="ms-1 font-normal text-slate-400">(JPEG / PNG / WebP, max 5 MB)</span>
        </p>

        <div className="relative mb-3 h-48 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          {preview ? (
            <>
              <Image src={preview} alt="University cover" fill className="object-cover" unoptimized={preview.startsWith('data:')} />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                title="Remove image"
              >
                ✕
              </button>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span className="text-sm">No image uploaded</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="image" className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            {preview ? 'Change image' : 'Upload image'}
          </label>
          <input ref={fileInputRef} id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleImageChange} className="hidden" />
          {preview && (
            <button type="button" onClick={handleRemove} className="text-sm font-medium text-rose-600 hover:underline">
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={dict.admin.nameEn} htmlFor="nameEn" required>
          <Input id="nameEn" name="nameEn" required maxLength={200} defaultValue={university?.name.en ?? ''} />
        </FormField>
        <FormField label={dict.admin.nameAr} htmlFor="nameAr">
          <Input id="nameAr" name="nameAr" maxLength={200} defaultValue={university?.name.ar ?? ''} dir="rtl" />
        </FormField>
      </div>

      <FormField label={dict.admin.city} htmlFor="city" required>
        <Input id="city" name="city" required maxLength={100} defaultValue={university?.city ?? ''} />
      </FormField>

      <FormField label={dict.admin.website} htmlFor="websiteUrl">
        <Input id="websiteUrl" name="websiteUrl" type="url" maxLength={255} defaultValue={university?.websiteUrl ?? ''} />
      </FormField>

      <FormField label={dict.admin.descriptionEn} htmlFor="descriptionEn">
        <Textarea id="descriptionEn" name="descriptionEn" rows={4} maxLength={5000} defaultValue={university?.description?.en ?? ''} />
      </FormField>

      <FormField label={dict.admin.descriptionAr} htmlFor="descriptionAr">
        <Textarea id="descriptionAr" name="descriptionAr" rows={4} maxLength={5000} defaultValue={university?.description?.ar ?? ''} dir="rtl" />
      </FormField>

      <FormField label={dict.admin.active} htmlFor="isActive">
        <Select id="isActive" name="isActive" defaultValue={String(university?.isActive ?? true)}>
          <option value="true">{dict.yes}</option>
          <option value="false">{dict.no}</option>
        </Select>
      </FormField>

      <div className="flex gap-3 pt-2">
        <SubmitBtn label={dict.save} />
        <Link href="/admin/cms/universities">
          <Button variant="outline" type="button">
            {dict.cancel}
          </Button>
        </Link>
      </div>
    </form>
  );
}
