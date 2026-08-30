import * as commonEn from './common';
import * as authEn from './auth';
import * as studentEn from './student';
import * as adminEn from './admin';
import * as statusesEn from './statuses';
import * as publicEn from './public';

const enRaw = {
  ...commonEn.en,
  auth: authEn.en,
  student: studentEn.en,
  admin: adminEn.en,
  statuses: statusesEn.en,
  public: publicEn.en,
};

const arRaw = {
  ...commonEn.ar,
  auth: authEn.ar,
  student: studentEn.ar,
  admin: adminEn.ar,
  statuses: statusesEn.ar,
  public: publicEn.ar,
};

export type Locale = 'en' | 'ar';

// Each domain file (common.ts, auth.ts, ...) declares its `en`/`ar` export
// with `as const`, so `authEn.en`, `statuses.ar`, etc. are already typed with
// readonly string-literal properties (e.g. `loginTitle: "Welcome back"`).
// Assigning them as properties above (rather than spreading fresh literals)
// preserves those literal types on enRaw/arRaw — dropping `as const` only on
// the merge here isn't enough. Widen recursively strips the literal/readonly
// typing down to plain `string`, so the English and Arabic dictionaries only
// need to share the same *shape*, not identical string values.
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? Widen<U>[]
    : T extends object
      ? { -readonly [K in keyof T]: Widen<T[K]> }
      : T;

export type Dictionary = Widen<typeof enRaw>;

export const dictionaries: Record<Locale, Dictionary> = {
  en: enRaw as Dictionary,
  ar: arRaw as Dictionary,
};

export function getDictionary(locale: string): Dictionary {
  return locale === 'ar' ? dictionaries.ar : dictionaries.en;
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

/** For DB content stored as JSONB bilingual fields: { en: string, ar?: string } */
export function getLocalized(content: { en: string; ar?: string | null } | null | undefined, locale: Locale): string {
  if (!content) return '';
  return locale === 'ar' && content.ar ? content.ar : content.en;
}
