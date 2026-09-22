import { getCorpus, getStories } from '@/lib/corpus';
import { attachArticleL10n } from '@/lib/localize';
import type { Region } from '@/lib/types';
import { Hero, StoryFeed, StoryGrid } from '@/components/StoryCard';
import { DateBar, EmptyState } from '@/components/DateBar';
import { FeedSections } from '@/components/FeedSections';
import { LatestRail } from '@/components/LatestRail';
import s from './page.module.css';

export const revalidate = 300;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const { region: raw } = await searchParams;
  const region: Region | undefined = raw === 'de' || raw === 'global' ? raw : undefined;

  const corpus = await getCorpus();
  const stories = await getStories(region ? { region } : {});

  // The page reads top-down: one hero, two beside it, six in a grid, the rest
  // as a dense list. Stories arrive sorted by weight, so slicing preserves it.
  // Proportions tuned for the wide canvas: three stories beside the lead fill
  // the hero column, and the grid runs four across on a large display.
  const lead = stories[0];
  const side = stories.slice(1, 4);
  const grid = stories.slice(4, 12);
  const rest = stories.slice(12, 52);
  const leaderboard = stories.slice(0, 8);

  const latest = await attachArticleL10n(
    corpus.articles.filter((a) => !region || a.region === region).slice(0, 12),
  );

  return (
    <div className={`${s.page} container`}>
      <DateBar
        heading
        basePath="/"
        region={region ?? 'all'}
        articles={corpus.articles.length}
        sources={new Set(corpus.articles.map((a) => a.sourceId)).size}
        failures={corpus.failures.length}
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
