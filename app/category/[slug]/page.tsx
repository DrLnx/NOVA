import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCorpus, getStories } from '@/lib/corpus';
import { levelFor } from '@/lib/rank';
import { CATEGORIES, type Category, type Region } from '@/lib/types';
import { LeadStory } from '@/components/StoryCard';
import { RegionFilter } from '@/components/RegionFilter';
import { EmptyState } from '@/components/Masthead';
import { CategoryMasthead } from '@/components/CategoryMasthead';
import { WeightedSections } from '@/components/WeightedSections';
import { LatestRail } from '@/components/LatestRail';
import s from '@/app/page.module.css';

export const revalidate = 300;

export function generateStaticParams() {
  return CATEGORIES.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.charAt(0).toUpperCase() + slug.slice(1) };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ region?: string }>;
}) {
  const { slug } = await params;
  if (!(CATEGORIES as readonly string[]).includes(slug)) notFound();
  const category = slug as Category;

  const { region: raw } = await searchParams;
  const region: Region | undefined = raw === 'de' || raw === 'global' ? raw : undefined;

  const corpus = await getCorpus();
  const stories = await getStories({ category, ...(region ? { region } : {}) });
  const [lead, ...rest] = stories;

  const firstRoutine = rest.findIndex((story) => levelFor(story.score) === 'routine');
  const major = firstRoutine === -1 ? rest : rest.slice(0, firstRoutine);
  const minor = firstRoutine === -1 ? [] : rest.slice(firstRoutine);

  const latest = corpus.articles
    .filter((a) => a.category === category && (!region || a.region === region))
    .slice(0, 10);

  return (
    <div className={`${s.page} container`}>
      <CategoryMasthead category={category} count={stories.length} />

      <div className={s.controls}>
        <RegionFilter basePath={`/category/${category}`} active={region ?? 'all'} />
      </div>

      {!lead ? (
        <EmptyState />
      ) : (
        <>
          <LeadStory story={lead} />
          <div className={s.split}>
            <WeightedSections major={major.slice(0, 24)} minor={minor.slice(0, 20)} />
            <aside className={s.rail}>
              <LatestRail articles={latest} />
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
