import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCorpus, getStories } from '@/lib/corpus';
import { attachArticleL10n, attachStoryL10n } from '@/lib/localize';
import { CATEGORIES, type Category, type Region } from '@/lib/types';
import { Hero } from '@/components/StoryCard';
import { DateBar, EmptyState } from '@/components/DateBar';
import { FeedSections } from '@/components/FeedSections';
import { CategoryHeading } from '@/components/CategoryMasthead';
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
  const stories = await attachStoryL10n(
    await getStories({ category, ...(region ? { region } : {}) }, 45),
  );

  const lead = stories[0];
  const side = stories.slice(1, 4);
  const grid = stories.slice(4, 12);
  const rest = stories.slice(12, 45);
  const leaderboard = stories.slice(0, 8);

  const latest = await attachArticleL10n(
    corpus.articles
      .filter((a) => a.category === category && (!region || a.region === region))
      .slice(0, 10),
  );

  return (
    <div className={`${s.page} container`}>
      <CategoryHeading category={category} count={stories.length} />

      <DateBar
        basePath={`/category/${category}`}
        region={region ?? 'all'}
        articles={corpus.articles.filter((a) => a.category === category).length}
        sources={new Set(corpus.articles.filter((a) => a.category === category).map((a) => a.sourceId)).size}
        failures={0}
      />

      {!lead ? (
        <EmptyState />
      ) : (
        <>
          <Hero lead={lead} side={side} />
          <FeedSections grid={grid} rest={rest} latest={latest} leaderboard={leaderboard} />
        </>
      )}
    </div>
  );
}
