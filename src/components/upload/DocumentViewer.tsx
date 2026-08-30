import { getLocalized, type Dictionary, type Locale } from '@/lib/i18n';
import { fmtDate, fmtFileSize } from '@/lib/utils';

interface AdminDoc {
  id: number;
  label: { en: string; ar?: string } | null;
  fileUrl: string;
  fileSizeKb: number;
  createdAt: string;
}

interface Props {
  documents: AdminDoc[];
  dict: Dictionary;
  locale: Locale;
}

/** Read-only list of documents Marina staff shared with the student. */
export function DocumentViewer({ documents, dict, locale }: Props) {
  if (documents.length === 0) {
    return <p className="px-5 py-4 text-sm text-slate-500">{dict.student.noAdminDocuments}</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between gap-3 px-5 py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">{getLocalized(doc.label, locale) || 'Document'}</p>
            <p className="text-xs text-slate-500">
              {fmtDate(doc.createdAt, locale)} · {fmtFileSize(doc.fileSizeKb)}
            </p>
          </div>
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {dict.student.download}
          </a>
        </li>
      ))}
    </ul>
  );
}
