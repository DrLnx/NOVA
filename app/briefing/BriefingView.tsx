'use client';

import Link from 'next/link';
import type { Story } from '@/lib/types';
import { getSource } from '@/lib/sources';
import { textFor } from '@/lib/i18n';
import { useApp, useDict } from '@/components/Providers';
import {
  CategoryTag, Separator, Timestamp, TranslationMark, WeightBadge,
} from '@/components/primitives';
import { EmptyState } from '@/components/DateBar';
import s from './briefing.module.css';

export function BriefingView({ stories }: { stories: Story[] }) {
  const dict = useDict();
  const { lang } = useApp();

  const today = new Intl.DateTimeFormat(lang === 'de' ? 'de-DE' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className={`${s.page} container`}>
      <header className={s.head}>
        <p className={s.date}>{today}</p>
        <h1 className={s.title}>{dict.briefingTitle}</h1>
        <p className={s.intro}>{dict.briefingIntro}</p>
      </header>

      {stories.length === 0 ? (
        <EmptyState title={dict.briefingEmpty} />
      ) : (
        <ol className={s.list}>
          {stories.map((story, i) => {
            const text = textFor(story, lang);
            const href =
              story.sourceIds.length > 1
                ? `/story/${story.id}`
                : `/article/${story.articles[0]?.id ?? ''}`;

            return (
              <li key={story.id} className={s.item}>
                <span className={s.index}>{String(i + 1).padStart(2, '0')}</span>
                <div className={s.body}>
                  <div className={s.meta}>
                    <WeightBadge story={story} showLabel />
                    <Separator />
                    <Timestamp iso={story.lastSeen} />
                    <Separator />
                    <CategoryTag category={story.category} />
                    <TranslationMark text={text} />
                  </div>

                  <h2>
                    <Link href={href} className={s.itemTitle}>
                      {text.title}
                    </Link>
                  </h2>

                  {text.summary ? <p className={s.itemSummary}>{text.summary}</p> : null}

                  {story.sourceIds.length > 1 ? (
                    <p className={s.spread}>
                      {dict.coverageSpreadBody(story.sourceIds.length, story.countries.length)}
                    </p>
                  ) : null}

                  <div className={s.outlets}>
                    {story.sourceIds.map((id) => (
                      <span key={id}>{getSource(id)?.short}</span>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
