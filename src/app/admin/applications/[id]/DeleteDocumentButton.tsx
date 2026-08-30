'use client';

import { deleteDocumentAction } from '@/actions/documents';

export function DeleteDocumentButton({ documentId, confirmLabel }: { documentId: number; confirmLabel: string }) {
  async function handleDelete() {
    if (!confirm(confirmLabel)) return;
    await deleteDocumentAction(documentId);
  }

  return (
    <button type="button" onClick={handleDelete} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
      ✕
    </button>
  );
}
