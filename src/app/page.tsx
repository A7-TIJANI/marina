import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { getLocale } from '@/lib/locale';
import { getDictionary, getLocalized } from '@/lib/i18n';
import { Container } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const revalidate = 300;

export default async function HomePage() {
  const locale = getLocale();
  const dict = getDictionary(locale);

  const universities = await prisma.university.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
    take: 3,
  });

  const reasons =
    locale === 'ar'
      ? [
          ['تعليم بالإنجليزية', 'تُقدَّم أغلب البرامج باللغة الإنجليزية منذ عام 2009.'],
          ['تكلفة معيشة معقولة', 'نفقات شهرية تتراوح بين 300 و600 دولار في كيغالي.'],
          ['أمان واستقرار', 'تُصنَّف رواندا من أكثر دول أفريقيا أماناً واستقراراً.'],
          ['دعم كامل من فريقنا', 'نتابع طلبك من التقديم وحتى استلام القبول.'],
        ]
      : [
          ['English-medium education', 'Most programmes have been taught in English since 2009.'],
          ['Affordable cost of living', 'Monthly expenses typically range from USD 300–600 in Kigali.'],
          ['Safe & stable', 'Rwanda is consistently ranked among the safest countries in Africa.'],
          ['Full support from our team', 'We follow your application from submission to admission letter.'],
        ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-900 via-brand-800 to-brand-700 text-white">
        <svg viewBox="0 0 1200 200" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-32 w-full text-brand-600/40" aria-hidden="true">
          <path d="M0 160 L150 90 L300 140 L450 60 L600 130 L750 50 L900 120 L1050 70 L1200 110 L1200 200 L0 200 Z" fill="currentColor" />
        </svg>
        <svg viewBox="0 0 1200 200" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-24 w-full text-brand-900/60" aria-hidden="true">
          <path d="M0 180 L200 120 L380 160 L560 100 L760 150 L960 90 L1200 140 L1200 200 L0 200 Z" fill="currentColor" />
        </svg>

        <Container className="relative py-16 sm:py-24">
          <div className="max-w-2xl">
            <span className="mb-4 inline-block rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-300">
              {dict.tagline}
            </span>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{dict.public.home.heroTitle}</h1>
            <p className="mt-4 text-base text-brand-100 sm:text-lg">{dict.public.home.heroSubtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary" fullWidth>
                  {dict.public.home.ctaApply}
                </Button>
              </Link>
              <Link href="/universities">
                <Button size="lg" variant="outline" fullWidth className="border-white/30 text-white hover:bg-white/10">
                  {dict.public.home.ctaUniversities}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Why Rwanda */}
      <section className="py-16">
        <Container>
          <h2 className="mb-8 text-2xl font-extrabold text-slate-900 sm:text-3xl">{dict.public.home.whyTitle}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-slate-200 p-5">
                <div className="mb-3 h-9 w-9 rounded-lg bg-amber-100" />
                <h3 className="mb-1.5 font-bold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured universities */}
      {universities.length > 0 && (
        <section className="bg-slate-50 py-16">
          <Container>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{dict.public.home.featuredUniversities}</h2>
              <Link href="/universities" className="text-sm font-semibold text-brand-700 hover:underline">
                {dict.public.home.viewAll} →
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {universities.map((uni) => {
                const name = getLocalized(uni.name as { en: string; ar?: string }, locale);
                const description = getLocalized(uni.description as { en: string; ar?: string } | null, locale);
                return (
                  <div key={uni.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="relative h-36 w-full bg-gradient-to-br from-brand-700 to-brand-900">
                      {uni.imageUrl ? (
                        <Image
                          src={uni.imageUrl}
                          alt={name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <svg viewBox="0 0 120 60" className="w-20 opacity-25" aria-hidden="true">
                            <path d="M0 50 L20 25 L35 40 L55 10 L75 35 L95 20 L120 30 L120 60 L0 60 Z" fill="white" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="mb-1 font-bold text-slate-900">{name}</h3>
                      <p className="mb-2 text-xs font-medium text-slate-400">{uni.city}</p>
                      <p className="line-clamp-2 text-sm text-slate-600">{description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>
      )}

      {/* How it works */}
      <section className="py-16">
        <Container>
          <h2 className="mb-10 text-2xl font-extrabold text-slate-900 sm:text-3xl">{dict.public.home.howItWorks}</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              [dict.public.home.step1Title, dict.public.home.step1Body],
              [dict.public.home.step2Title, dict.public.home.step2Body],
              [dict.public.home.step3Title, dict.public.home.step3Body],
            ].map(([title, body], i) => (
              <div key={title} className="relative">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mb-1.5 font-bold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
