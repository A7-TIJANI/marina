import Image from 'next/image';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary, getLocalized } from '@/lib/i18n';
import { Container } from '@/components/ui/Card';

export const revalidate = 300;

export default async function UniversitiesPage() {
  const locale = getLocale();
  const dict = getDictionary(locale);

  const universities = await prisma.university.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
  });

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-extrabold text-slate-900">{dict.public.universitiesTitle}</h1>
      <p className="mt-2 max-w-2xl text-slate-600">{dict.public.universitiesSubtitle}</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {universities.map((uni) => {
          const name = getLocalized(uni.name as { en: string; ar?: string }, locale);
          const description = getLocalized(uni.description as { en: string; ar?: string } | null, locale);
          return (
            <div key={uni.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="relative h-44 w-full bg-gradient-to-br from-brand-700 to-brand-900">
                {uni.imageUrl ? (
                  <Image src={uni.imageUrl} alt={name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                ) : (
                  <UniversityPlaceholder name={name} city={uni.city} />
                )}
                <span className="absolute end-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {uni.city}
                </span>
              </div>

              <div className="p-5">
                <h2 className="text-lg font-bold text-slate-900">{name}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{description}</p>
                {uni.websiteUrl && (
                  <a
                    href={uni.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
                  >
                    {uni.websiteUrl.replace(/^https?:\/\//, '')} ↗
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {universities.length === 0 && <p className="mt-8 text-slate-500">{dict.noResults}</p>}
    </Container>
  );
}

function UniversityPlaceholder({ name, city }: { name: string; city: string }) {
  const hues = [220, 200, 240, 260, 180, 210];
  const hue = hues[name.charCodeAt(0) % hues.length];

  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-1 px-6"
      style={{ background: `linear-gradient(135deg, hsl(${hue},70%,30%), hsl(${hue},60%,18%))` }}
    >
      <svg viewBox="0 0 120 60" className="mb-1 w-24 opacity-30" aria-hidden="true">
        <path d="M0 50 L20 25 L35 40 L55 10 L75 35 L95 20 L120 30 L120 60 L0 60 Z" fill="white" />
      </svg>
      <p className="text-center text-sm font-bold leading-tight text-white/80">{name}</p>
      <p className="text-xs text-white/50">{city}</p>
    </div>
  );
}
