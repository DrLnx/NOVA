'use client';

import type { Story } from '@/lib/types';
import { StoryFeed } from './StoryCard';
import { SectionHead } from './primitives';
import { useDict } from './Providers';
import s from '@/app/page.module.css';

/**
 * Splits the feed by importance rather than presenting one undifferentiated
 * column, so "what actually matters today" is answerable at a glance instead of
 * requiring the reader to scroll and compare.
 */
export function WeightedSections({ major, minor }: { major: Story[]; minor: Story[] }) {
  const dict = useDict();
  return (
    <div>
      {major.length > 0 ? (
        <section>
          <SectionHead title={dict.leadStories} count={dict.sortedByWeight} />
          <StoryFeed stories={major} />
        </section>
      ) : null}

      {minor.length > 0 ? (
        <section style={{ marginTop: 'var(--s7)' }}>
          <SectionHead title={dict.furtherStories} count={String(minor.length)} />
          <StoryFeed stories={minor} />
        </section>
      ) : null}
    </div>
  );
}
