'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Article, Category, LocalizedText, Story } from '@/lib/types';
import { getSource } from '@/lib/sources';
import { isRenderableImage } from '@/lib/images';
import { absoluteTime, relativeTime } from '@/lib/i18n';
import { LEVEL_BARS, weighStory } from '@/lib/rank';
import { useApp, useDict } from './Providers';
import s from './primitives.module.css';

export function SourceBadge({ sourceId }: { sourceId: string }) {
  const source = getSource(sourceId);
  if (!source) return null;
  return (
    <span className={`mono ${s.source}`}>
      <span className={`${s.tierDot} ${s[`tier${source.tier}`] ?? ''}`} aria-hidden />
      <span className={s.sourceName}>{source.short}</span>
    </span>
  );
}

/**
 * Rendered on the client so the relative time is correct for the reader's clock
 * rather than the server's, and stays correct as the page sits open. Before
 * hydration it shows the absolute time, which is never wrong.
 */
export function Timestamp({ iso }: { iso: string }) {
  const { lang, hydrated } = useApp();
  const dict = useDict();
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <time className="mono" dateTime={iso} title={absoluteTime(iso, lang)}>
      {hydrated ? relativeTime(iso, dict) : absoluteTime(iso, lang)}
    </time>
  );
}

export function CategoryTag({ category }: { category: Category }) {
  const dict = useDict();
  return (
    <Link href={`/category/${category}`} className={`mono ${s.tag}`}>
      {dict.categories[category]}
    </Link>
  );
}

export function Separator() {
  return <span className={s.sep} aria-hidden />;
}

/** The headline affordance: how many outlets independently covered this story. */
export function CoveragePill({ story }: { story: Story }) {
  const dict = useDict();
  const n = story.sourceIds.length;
  if (n < 2) return null;
  return (
    <span className={`mono ${s.coverage} ${n >= 4 ? s.coverageStrong : ''}`}>
      <span className={s.dots} aria-hidden>
        {Array.from({ length: Math.min(n, 5) }, (_, i) => (
          <span key={i} className={s.dot} />
        ))}
      </span>
      {dict.sourcesCovering(n)}
    </span>
  );
}

/**
 * Feed images come from a dozen different CDNs at unpredictable sizes, and
 * roughly a third of articles have none at all. Anything not on the allowlist
 * degrades to a monogram rather than a broken box.
 */
export function ImageTile({
  src,
  alt,
  sourceId,
  width,
  height,
  sizes,
  priority,
  className,
}: {
  src: string | undefined;
  alt?: string | undefined;
  sourceId: string;
  width: number;
  height: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const source = getSource(sourceId);
  const usable = isRenderableImage(src) && !failed;

  return (
    <div
      className={`${s.tile} ${className ?? ''}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {usable ? (
        <Image
          src={src}
          alt={alt ?? ''}
          width={width}
          height={height}
          sizes={sizes ?? '(max-width: 768px) 100vw, 400px'}
          priority={priority ?? false}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={s.fallback}>
          <span className={s.monogram}>{source?.short ?? 'SCOPE'}</span>
        </div>
      )}
    </div>
  );
}

export function BookmarkButton({ article }: { article: Article }) {
  const { isSaved, toggleSaved, hydrated } = useApp();
  const dict = useDict();
  const active = hydrated && isSaved(article.id);

  return (
    <button
      type="button"
      className={`${s.bookmark} ${active ? s.bookmarkActive : ''}`}
      aria-pressed={active}
      aria-label={active ? dict.unsave : dict.save}
      title={active ? dict.unsave : dict.save}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSaved(article.id);
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <path
          d="M3.5 1.5h7a.5.5 0 0 1 .5.5v10.2a.3.3 0 0 1-.47.25L7 9.8l-3.53 2.65A.3.3 0 0 1 3 12.2V2a.5.5 0 0 1 .5-.5Z"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function SectionHead({ title, count }: { title: string; count?: string }) {
  return (
    <div className={s.sectionHead}>
      <h2 className={s.sectionTitle}>{title}</h2>
      {count ? <span className={s.sectionCount}>{count}</span> : null}
    </div>
  );
}

/**
 * The importance indicator.
 *
 * Shows the number as well as the bars: a badge alone asks to be trusted, a
 * number can be checked against the breakdown on the story page. The word
 * label is reserved for lead stories, so scanning a column of cards is not
 * competing with a repeated "NOTABLE" on every row.
 */
export function WeightBadge({ story, showLabel }: { story: Story; showLabel?: boolean }) {
  const dict = useDict();
  const weight = weighStory(story);
  const bars = LEVEL_BARS[weight.level];
  const withLabel = showLabel ?? weight.level === 'lead';

  return (
    <span
      className={`${s.weight} ${weight.level === 'lead' ? s.weightLead : ''}`}
      title={`${dict.weight}: ${weight.value}/100 · ${dict.importance[weight.level]}`}
    >
      <span className={s.bars} aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`${s.bar} ${i < bars ? s.barOn : ''}`} />
        ))}
      </span>
      {withLabel ? <span className={s.weightLabel}>{dict.importance[weight.level]}</span> : null}
      <span className={s.weightValue}>{weight.value}</span>
      <span className="visually-hidden">
        {dict.weight} {weight.value} / 100, {dict.importance[weight.level]}
      </span>
    </span>
  );
}

/**
 * Marks text that is not the newsroom's own wording. Machine translation gets
 * things wrong, so a reader is always told when they are looking at it rather
 * than at what the outlet actually wrote.
 */
export function TranslationMark({ text }: { text: LocalizedText }) {
  const { lang } = useApp();
  const dict = useDict();

  if (text.translated) {
    return (
      <span className={s.mark} title={dict.translatedNote}>
        {dict.translated}
      </span>
    );
  }
  if (text.lang !== lang) {
    return (
      <span className={s.mark} title={dict.originalLanguage}>
        {text.lang === 'de' ? dict.inGerman : dict.inEnglish}
      </span>
    );
  }
  return null;
}

/** The arithmetic behind a story's weight, shown on its own page. */
export function WeightBreakdown({ story }: { story: Story }) {
  const dict = useDict();
  const weight = weighStory(story);

  return (
    <div className={s.breakdown}>
      {weight.factors.map((f) => (
        <div key={f.key} className={s.breakdownRow}>
          <span className={s.breakdownLabel}>{dict.weightFactors[f.key]}</span>
          <span className={s.breakdownDetail}>{f.detail ?? ''}</span>
          <span className={s.breakdownPoints}>+{f.points}</span>
        </div>
      ))}
      <div className={s.breakdownTotal}>
        <span className={s.breakdownTotalLabel}>{dict.importance[weight.level]}</span>
        <span className={s.breakdownTotalValue}>{weight.value}</span>
      </div>
    </div>
  );
}
