'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { verifyDocumentAction, rejectDocumentAction } from '@/actions/documents';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { fmtFileSize, fmtDateTime } from '@/lib/utils';
import type { Dictionary, Locale } from '@/lib/i18n';

interface DocRow {
  id: number;
  documentType: string;
  fileUrl: string;
  fileSizeKb: number;
  mimeType: string;
  isVerified: boolean;
  createdAt: string;
  uploadedByName: string;
}

interface Props {
  documents: DocRow[];
  dict: Dictionary;
  locale: Locale;
}

const TYPE_LABEL_KEY: Record<string, keyof Dictionary['student']> = {
  passport_photo: 'passportPhoto',
  secondary_diploma: 'secondaryDiploma',
};

function VerifyButton({ documentId, dict }: { documentId: number; dict: Dictionary }) {
  const { pending } = useFormStatus();
  return (
    <form
      action={async (fd) => {
        fd.set('documentId', String(documentId));
        fd.set('verified', 'true');
        const res = await verifyDocumentAction(fd);
        if (res.ok) toast.success(res.message ?? dict.success);
        else toast.error(res.message ?? dict.somethingWentWrong);
      }}
    >
      <Button type="submit" size="sm" variant="primary" disabled={pending}>
        {dict.admin.verifyButton}
      </Button>
    </form>
  );
}

function RejectControl({ documentId, dict }: { documentId: number; dict: Dictionary }) {
  const [state, formAction] = useFormState(rejectDocumentAction, { ok: false });
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? dict.success);
      setOpen(false);
      setReason('');
    } else if (state.message) {
      toast.error(state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (!open) {
    return (
      <Button type="button" size="sm" variant="danger" onClick={() => setOpen(true)}>
        {dict.admin.rejectButton}
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-1 items-center gap-2">
      <input type="hidden" name="documentId" value={documentId} />
      <input
        type="text"
        name="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={dict.admin.rejectReasonPrompt}
        className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
        required
      />
      <Button type="submit" size="sm" variant="danger">
        {dict.admin.rejectButton}
      </Button>
    </form>
  );
}

export function DocumentList({ documents, dict, locale }: Props) {
  const studentDocs = documents.filter((d) => d.documentType !== 'admin_document');

  if (studentDocs.length === 0) {
    return <p className="px-5 py-4 text-sm text-slate-500">{dict.admin.noStudentDocuments}</p>;
  }

  const allVerified = studentDocs.length >= 2 && studentDocs.every((d) => d.isVerified);

  return (
    <div>
      {allVerified && (
        <div className="mx-5 mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {dict.admin.allDocsVerifiedBanner}
        </div>
      )}
      <div className="divide-y divide-slate-100">
        {studentDocs.map((doc) => {
          const labelKey = TYPE_LABEL_KEY[doc.documentType];
          const label = labelKey ? dict.student[labelKey] : doc.documentType;
          return (
            <div key={doc.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{label as string}</span>
                  {doc.isVerified ? (
                    <Badge className="bg-emerald-100 text-emerald-700 ring-emerald-300">{dict.student.docStatusVerified}</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 ring-amber-300">{dict.student.docStatusUploadedPending}</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {fmtDateTime(doc.createdAt, locale)} · {doc.uploadedByName} · {fmtFileSize(doc.fileSizeKb)} · {doc.mimeType}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {dict.student.viewFullButton}
                </a>
                {!doc.isVerified && (
                  <>
                    <VerifyButton documentId={doc.id} dict={dict} />
                    <RejectControl documentId={doc.id} dict={dict} />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
