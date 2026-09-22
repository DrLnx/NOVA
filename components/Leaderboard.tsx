'use client';

import Link from 'next/link';
import type { Story } from '@/lib/types';
import { textFor } from '@/lib/i18n';
import { weighStory } from '@/lib/rank';
import { useApp, useDict } from './Providers';
import { storyHref } from './StoryCard';
import { SectionHeading } from './DateBar';
import s from './Leaderboard.module.css';

/**
 * The day's stories ordered purely by weight, with the number shown large.
 *
 * The feed already orders by weight, but reading position is a weak signal —
 * this makes the ranking itself the object, so "what actually matters today"
 * is one glance rather than a scroll and a comparison.
 */
export function Leaderboard({ stories }: { stories: Story[] }) {
  const { lang } = useApp();
  const dict = useDict();
  if (stories.length === 0) return null;

  return (
    <section>
      <SectionHeading title={dict.byWeight} />
      <ol className={s.list}>
        {stories.map((story, i) => {
          const weight = weighStory(story);
          const text = textFor(story, lang);
          return (
            <li key={story.id} className={s.item}>
              <span className={s.rank}>{String(i + 1).padStart(2, '0')}</span>
              <Link href={storyHref(story)} className={s.title}>
                {text.title}
              </Link>
              <span className={s.value} title={`${dict.weight} ${weight.value}/100`}>
                {weight.value}
              </span>
              <span className={s.track} aria-hidden>
                <span className={s.fill} style={{ width: `${weight.value}%` }} />
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
