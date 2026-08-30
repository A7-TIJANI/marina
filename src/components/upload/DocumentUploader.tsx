'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { uploadStudentDocumentAction, deleteOwnDocumentAction } from '@/actions/documents';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, fmtFileSize, fmtDate } from '@/lib/utils';
import type { Dictionary, Locale } from '@/lib/i18n';

interface ExistingDoc {
  id: number;
  fileUrl: string;
  fileSizeKb: number;
  mimeType: string;
  isVerified: boolean;
  createdAt: string;
}

interface Props {
  applicationId: number;
  documentType: 'passport_photo' | 'secondary_diploma';
  existingDoc: ExistingDoc | null;
  dict: Dictionary;
  locale: Locale;
}

const MAX_BYTES: Record<Props['documentType'], number> = {
  passport_photo: 5 * 1024 * 1024,
  secondary_diploma: 10 * 1024 * 1024,
};

const ACCEPT: Record<Props['documentType'], string> = {
  passport_photo: 'image/jpeg,image/png,image/webp',
  secondary_diploma: 'application/pdf',
};

function SubmitButton({ label, disabledUntilFileChosen }: { label: string; disabledUntilFileChosen: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending || disabledUntilFileChosen}>
      {pending ? '…' : label}
    </Button>
  );
}

export function DocumentUploader({ applicationId, documentType, existingDoc, dict, locale }: Props) {
  const [state, formAction] = useFormState(uploadStudentDocumentAction, { ok: false });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const title = documentType === 'passport_photo' ? dict.student.passportPhoto : dict.student.secondaryDiploma;
  const isImage = documentType === 'passport_photo';

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? dict.student.uploadSuccess);
      setFile(null);
      setPreviewUrl(null);
    } else if (state.message) {
      toast.error(state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function pickFile(f: File | null) {
    setClientError(null);
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (f.size > MAX_BYTES[documentType]) {
      setClientError(dict.student.uploadErrorGeneric);
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setFile(f);
    if (isImage) {
      setPreviewUrl(URL.createObjectURL(f));
    }
  }

  async function handleDelete() {
    if (!existingDoc) return;
    setDeleting(true);
    const res = await deleteOwnDocumentAction(existingDoc.id);
    setDeleting(false);
    if (res.ok) {
      toast.success(dict.success);
    } else {
      toast.error(res.message ?? dict.somethingWentWrong);
    }
  }

  const statusBadge = existingDoc ? (
    existingDoc.isVerified ? (
      <Badge className="bg-emerald-100 text-emerald-700 ring-emerald-300">{dict.student.docStatusVerified}</Badge>
    ) : (
      <Badge className="bg-amber-100 text-amber-700 ring-amber-300">{dict.student.docStatusUploadedPending}</Badge>
    )
  ) : (
    <Badge className="bg-slate-100 text-slate-600 ring-slate-300">{dict.student.docStatusMissing}</Badge>
  );

  return (
    <div className="border-b border-slate-100 px-5 py-4 last:border-b-0">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {statusBadge}
      </div>

      {existingDoc && !file && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span>
            {fmtFileSize(existingDoc.fileSizeKb)} · {fmtDate(existingDoc.createdAt, locale)}
          </span>
          <a href={existingDoc.fileUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 hover:underline">
            {dict.student.viewFullButton}
          </a>
          {!existingDoc.isVerified && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="font-semibold text-rose-600 hover:underline disabled:opacity-50"
            >
              {dict.student.deleteButton}
            </button>
          )}
        </div>
      )}

      <form action={formAction}>
        <input type="hidden" name="applicationId" value={applicationId} />
        <input type="hidden" name="documentType" value={documentType} />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) pickFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition-colors',
            dragOver ? 'border-brand-400 bg-brand-50' : 'border-slate-300 hover:border-slate-400'
          )}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-24 w-24 rounded-lg object-cover" />
          ) : file ? (
            <span className="font-medium text-slate-700">{file.name}</span>
          ) : (
            <span className="text-slate-500">{dict.student.dropzoneHint}</span>
          )}
          <input
            ref={inputRef}
            type="file"
            name="file"
            accept={ACCEPT[documentType]}
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {clientError && <p className="mt-1 text-xs font-medium text-rose-600">{clientError}</p>}

        <div className="mt-3 flex justify-end">
          <SubmitButton
            label={existingDoc ? dict.student.replaceButton : dict.student.uploadButton}
            disabledUntilFileChosen={!file}
          />
        </div>
      </form>
    </div>
  );
}
