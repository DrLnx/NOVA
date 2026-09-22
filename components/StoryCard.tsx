import Link from 'next/link';
import type { Story } from '@/lib/types';
import {
  BookmarkButton, CategoryTag, CoveragePill, ImageTile, SourceBadge, Separator,
  Timestamp, WeightBadge,
} from './primitives';
import s from './cards.module.css';

/**
 * A story links to its own page whenever more than one outlet covered it —
 * that page is where the framing comparison lives. A single-source story links
 * straight to the article context page, since there is nothing to compare.
 */
function storyHref(story: Story): string {
  return story.sourceIds.length > 1
    ? `/story/${story.id}`
    : `/article/${story.articles[0]?.id ?? ''}`;
}

export function LeadStory({ story }: { story: Story }) {
  const lead = story.articles[0];
  if (!lead) return null;

  return (
    <article className={`${s.lead} rise`}>
      <div className={s.leadBody}>
        <div className={s.rowMeta}>
          <WeightBadge story={story} />
          <Separator />
          <SourceBadge sourceId={lead.sourceId} />
          <Separator />
          <Timestamp iso={story.lastSeen} />
          <Separator />
          <CategoryTag category={story.category} />
        </div>

        <h2 className={s.leadTitle}>
          <Link href={storyHref(story)}>{story.title}</Link>
        </h2>

        {story.summary ? <p className={s.leadSummary}>{story.summary}</p> : null}

        <div className={s.rowMeta}>
          <CoveragePill story={story} />
          <BookmarkButton article={lead} />
        </div>
      </div>

      <Link href={storyHref(story)} className={s.leadImage} tabIndex={-1} aria-hidden>
        <ImageTile
          src={story.image}
          alt={story.imageAlt ?? ''}
          sourceId={lead.sourceId}
          width={800}
          height={500}
          sizes="(max-width: 900px) 100vw, 520px"
          priority
        />
      </Link>
    </article>
  );
}

export function StoryRow({ story }: { story: Story }) {
  const lead = story.articles[0];
  if (!lead) return null;
  const href = storyHref(story);

  return (
    <article className={s.row}>
      <div className={s.rowBody}>
        <div className={s.rowMeta}>
          <WeightBadge story={story} />
          <Separator />
          <SourceBadge sourceId={lead.sourceId} />
          <Separator />
          <Timestamp iso={story.lastSeen} />
          <Separator />
          <CategoryTag category={story.category} />
        </div>

        <h3 className={s.rowTitle}>
          <Link href={href} className={s.stretch}>
            {story.title}
          </Link>
        </h3>

        {story.summary ? <p className={s.rowSummary}>{story.summary}</p> : null}

        <div className={s.rowFoot}>
          <CoveragePill story={story} />
          <BookmarkButton article={lead} />
        </div>
      </div>

      <div className={s.rowImage}>
        <ImageTile
          src={story.image}
          alt=""
          sourceId={lead.sourceId}
          width={264}
          height={176}
          sizes="132px"
        />
      </div>
    </article>
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
