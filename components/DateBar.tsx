'use client';

import { useApp, useDict } from './Providers';
import { RegionFilter } from './RegionFilter';
import s from '@/app/page.module.css';

/**
 * The edition strip: what day it is, how much has been read, and how much of it
 * is live. It replaces a large title block — a news front page does not need to
 * tell you it contains news.
 */
export function DateBar({
  basePath,
  region,
  articles,
  sources,
  failures,
  heading,
}: {
  basePath: string;
  region: 'all' | 'de' | 'global';
  articles: number;
  sources: number;
  failures: number;
  /** Renders the page's h1. The front page shows no visible title by design,
   *  so it is available to assistive technology only. */
  heading?: boolean;
}) {
  const { lang } = useApp();
  const dict = useDict();

  const date = new Intl.DateTimeFormat(lang === 'de' ? 'de-DE' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const number = new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-GB');

  return (
    <div className={s.bar}>
      {heading ? (
        <h1 className="visually-hidden">
          SCOPE — {dict.tagline}. {dict.subtitle}
        </h1>
      ) : null}

      <div className={s.barLeft}>
        <span className={s.date}>{date}</span>
        <span className={s.stat}>
          {number.format(articles)} {dict.articlesWord} · {sources} {dict.sourcesWord}
        </span>
        {failures > 0 ? <span className={s.stat}>{dict.sourcesUnavailable(failures)}</span> : null}
      </div>

      <div className={s.barRight}>
        <span className={`${s.stat} ${s.live}`}>
          <span className={s.pulse} aria-hidden />
          {dict.updated}
        </span>
        <RegionFilter basePath={basePath} active={region} />
      </div>
    </div>
  );
}

export function SectionHeading({ title, note }: { title: string; note?: string }) {
  return (
    <div className={s.sectionHead}>
      <h2 className={s.sectionTitle}>{title}</h2>
      {note ? <span className={s.sectionNote}>{note}</span> : null}
    </div>
  );
}

export function EmptyState({ title, body }: { title?: string; body?: string }) {
  const dict = useDict();
  return (
    <div className={s.empty}>
      <p className={s.emptyTitle}>{title ?? dict.noArticles}</p>
      <p className={s.emptyBody}>{body ?? dict.noArticlesHint}</p>
    </div>
  );
}
