'use client';

import type { Article, Story } from '@/lib/types';
import { StoryFeed, StoryGrid } from './StoryCard';
import { SectionHeading } from './DateBar';
import { LatestRail } from './LatestRail';
import { Leaderboard } from './Leaderboard';
import { useDict } from './Providers';
import s from '@/app/page.module.css';

/**
 * The body of the front page below the hero. Splitting by weight rather than
 * running one long column is what makes "what actually matters today"
 * answerable at a glance.
 */
export function FeedSections({
  grid,
  rest,
  latest,
  leaderboard,
}: {
  grid: Story[];
  rest: Story[];
  latest: Article[];
  leaderboard: Story[];
}) {
  const dict = useDict();

  return (
    <>
      {grid.length > 0 ? (
        <section className={s.section}>
          <SectionHeading title={dict.leadStories} note={dict.sortedByWeight} />
          <StoryGrid stories={grid} />
        </section>
      ) : null}

      <div className={s.split}>
        {rest.length > 0 ? (
          <section>
            <SectionHeading title={dict.furtherStories} note={String(rest.length)} />
            <StoryFeed stories={rest} />
          </section>
        ) : (
          <div />
        )}

        <aside className={s.rail}>
          <Leaderboard stories={leaderboard} />
          <LatestRail articles={latest} />
        </aside>
      </div>
    </>
  );
}
