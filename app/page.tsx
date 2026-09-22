import { getCorpus, getStories } from '@/lib/corpus';
import { levelFor } from '@/lib/rank';
import type { Region } from '@/lib/types';
import { LeadStory, StoryFeed } from '@/components/StoryCard';
import { RegionFilter } from '@/components/RegionFilter';
import { EmptyState, Masthead } from '@/components/Masthead';
import { LatestRail } from '@/components/LatestRail';
import { WeightedSections } from '@/components/WeightedSections';
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

  const [lead, ...rest] = stories;

  // Stories arrive already sorted by weight, so a single split keeps the two
  // sections in order without re-sorting.
  const firstRoutine = rest.findIndex((story) => levelFor(story.score) === 'routine');
  const major = firstRoutine === -1 ? rest : rest.slice(0, firstRoutine);
  const minor = firstRoutine === -1 ? [] : rest.slice(firstRoutine);

  const latest = corpus.articles.filter((a) => !region || a.region === region).slice(0, 12);

  return (
    <div className={`${s.page} container`}>
      <Masthead builtAt={corpus.builtAt} failureCount={corpus.failures.length} />

      <div className={s.controls}>
        <RegionFilter basePath="/" active={region ?? 'all'} />
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
