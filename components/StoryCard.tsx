'use client';

import Link from 'next/link';
import type { Story } from '@/lib/types';
import { textFor } from '@/lib/i18n';
import { useApp } from './Providers';
import {
  BookmarkButton, CoveragePill, ImageTile, SourceBadge, Separator, Timestamp,
  TranslationMark, WeightBadge,
} from './primitives';
import s from './cards.module.css';

/**
 * Multi-source stories link to their own page, where the framing comparison
 * lives. A single-source story goes straight to the article context page —
 * there is nothing there to compare.
 */
export function storyHref(story: Story): string {
  return story.sourceIds.length > 1
    ? `/story/${story.id}`
    : `/article/${story.articles[0]?.id ?? ''}`;
}

function useStory(story: Story) {
  const { lang } = useApp();
  const text = textFor(story, lang);
  return { text, href: storyHref(story), lang };
}

export function HeroLead({ story }: { story: Story }) {
  const { text, href } = useStory(story);
  const lead = story.articles[0];
  if (!lead) return null;

  return (
    <article className={s.heroLead}>
      <Link href={href} className={s.heroImage} tabIndex={-1} aria-hidden>
        <ImageTile
          src={story.image}
          alt=""
          sourceId={text.sourceId || lead.sourceId}
          width={1120}
          height={630}
          sizes="(max-width: 900px) 100vw, 660px"
          priority
        />
      </Link>

      <div className={s.meta}>
        <WeightBadge story={story} />
        <Separator />
        <SourceBadge sourceId={text.sourceId || lead.sourceId} />
        <Separator />
        <Timestamp iso={story.lastSeen} />
        <TranslationMark text={text} />
      </div>

      <h2 className={s.headline}>
        <Link href={href} className={s.stretch}>
          {text.title}
        </Link>
      </h2>

      {text.summary ? <p className={s.summary}>{text.summary}</p> : null}

      <div className={s.foot}>
        <CoveragePill story={story} />
        <BookmarkButton article={lead} />
      </div>
    </article>
  );
}

export function HeroSideItem({ story }: { story: Story }) {
  const { text, href } = useStory(story);
  const lead = story.articles[0];
  if (!lead) return null;

  return (
    <article className={s.heroSideItem}>
      <div className={s.meta}>
        <WeightBadge story={story} />
        <Separator />
        <Timestamp iso={story.lastSeen} />
        <TranslationMark text={text} />
      </div>

      <h3 className={s.headline}>
        <Link href={href} className={s.stretch}>
          {text.title}
        </Link>
      </h3>

      {text.summary ? <p className={s.summary}>{text.summary}</p> : null}

      <div className={s.foot}>
        <SourceBadge sourceId={text.sourceId || lead.sourceId} />
        <CoveragePill story={story} />
      </div>
    </article>
  );
}

export function StoryGridCard({ story }: { story: Story }) {
  const { text, href } = useStory(story);
  const lead = story.articles[0];
  if (!lead) return null;

  return (
    <article className={s.gridCard}>
      <Link href={href} className={s.gridImage} tabIndex={-1} aria-hidden>
        <ImageTile
          src={story.image}
          alt=""
          sourceId={text.sourceId || lead.sourceId}
          width={640}
          height={360}
          sizes="(max-width: 560px) 100vw, (max-width: 900px) 46vw, 300px"
        />
      </Link>

      <div className={s.meta}>
        <WeightBadge story={story} />
        <Separator />
        <Timestamp iso={story.lastSeen} />
        <TranslationMark text={text} />
      </div>

      <h3 className={s.headline}>
        <Link href={href} className={s.stretch}>
          {text.title}
        </Link>
      </h3>

      {text.summary ? <p className={s.summary}>{text.summary}</p> : null}

      <div className={s.foot}>
        <SourceBadge sourceId={text.sourceId || lead.sourceId} />
        <CoveragePill story={story} />
      </div>
    </article>
  );
}

export function StoryRow({ story }: { story: Story }) {
  const { text, href } = useStory(story);
  const lead = story.articles[0];
  if (!lead) return null;

  return (
    <article className={s.row}>
      <div className={s.rowBody}>
        <div className={s.meta}>
          <WeightBadge story={story} />
          <Separator />
          <SourceBadge sourceId={text.sourceId || lead.sourceId} />
          <Separator />
          <Timestamp iso={story.lastSeen} />
          <TranslationMark text={text} />
        </div>

        <h3 className={s.headline}>
          <Link href={href} className={s.stretch}>
            {text.title}
          </Link>
        </h3>

        {text.summary ? <p className={s.summary}>{text.summary}</p> : null}

        <div className={s.foot}>
          <CoveragePill story={story} />
          <BookmarkButton article={lead} />
        </div>
      </div>

      <div className={s.rowImage}>
        <ImageTile
          src={story.image}
          alt=""
          sourceId={text.sourceId || lead.sourceId}
          width={336}
          height={224}
          sizes="168px"
        />
      </div>
    </article>
  );
}

export function StoryGrid({ stories }: { stories: Story[] }) {
  return (
    <ul className={`${s.grid} ruled`}>
      {stories.map((story) => (
        <li key={story.id}>
          <StoryGridCard story={story} />
        </li>
      ))}
    </ul>
  );
}

export function StoryFeed({ stories }: { stories: Story[] }) {
  return (
    <ul className={s.list}>
      {stories.map((story) => (
        <li key={story.id}>
          <StoryRow story={story} />
        </li>
      ))}
    </ul>
  );
}

/** The hero block: one lead story with two more alongside it. */
export function Hero({ lead, side }: { lead: Story; side: Story[] }) {
  return (
    <section className={s.hero}>
      <HeroLead story={lead} />
      <div className={s.heroSide}>
        {side.map((story) => (
          <HeroSideItem key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
}
