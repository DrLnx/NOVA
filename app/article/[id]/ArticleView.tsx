'use client';

import Link from 'next/link';
import type { Article, Story } from '@/lib/types';
import { getSource } from '@/lib/sources';
import { absoluteTime, textFor } from '@/lib/i18n';
import { useApp, useDict } from '@/components/Providers';
import {
  BookmarkButton, CategoryTag, CoveragePill, ImageTile, SectionHead, Separator,
  SourceBadge, Timestamp, TranslationMark,
} from '@/components/primitives';
import { ArticleCompact } from '@/components/ArticleCard';
import s from './article.module.css';

function ExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M3 1h6v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 1 1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * A context page, not a reader. SCOPE never reproduces article text, so the
 * job here is to frame the piece — who published it, when, who else covered the
 * same event — and then send the reader to the publisher.
 */
export function ArticleView({
  article,
  story,
  others,
  moreFromSource,
}: {
  article: Article;
  story: Story | undefined;
  others: Article[];
  moreFromSource: Article[];
}) {
  const dict = useDict();
  const { lang } = useApp();
  const source = getSource(article.sourceId);
  const text = textFor(article, lang);
  const showOriginal = text.title !== article.title;

  return (
    <div className={`${s.page} container`}>
      <Link href={story && story.sourceIds.length > 1 ? `/story/${story.id}` : '/'} className={s.back}>
        ← {story && story.sourceIds.length > 1 ? dict.allCoverage : dict.backToFeed}
      </Link>

      <div className={s.layout}>
        <article>
          <div className={s.meta}>
            <SourceBadge sourceId={article.sourceId} />
            <Separator />
            <Timestamp iso={article.publishedAt} />
            <Separator />
            <CategoryTag category={article.category} />
            <TranslationMark text={text} />
          </div>

          <h1 className={s.title}>{text.title}</h1>

          {showOriginal ? (
            <p className={s.original}>
              <span className={s.originalLabel}>{dict.originalHeadline}</span>
              {article.title}
            </p>
          ) : null}

          {article.author ? (
            <p className={s.byline}>
              {article.author} · {absoluteTime(article.publishedAt, lang)}
            </p>
          ) : null}

          {article.image ? (
            <div className={s.hero}>
              <ImageTile
                src={article.image}
                alt={article.imageAlt ?? ''}
                sourceId={article.sourceId}
                width={1000}
                height={563}
                sizes="(max-width: 1000px) 100vw, 780px"
                priority
              />
            </div>
          ) : null}

          {text.summary ? <p className={s.summary}>{text.summary}</p> : null}

          <div className={s.ctaRow}>
            <a className={s.cta} href={article.url} target="_blank" rel="noopener noreferrer">
              {dict.readAt(source?.name ?? '')} <ExternalIcon />
            </a>
            {story ? <CoveragePill story={story} /> : null}
            <BookmarkButton article={article} />
          </div>

          <p className={s.notice}>{dict.excerptNotice}</p>

          {others.length > 0 ? (
            <section className={s.section}>
              <SectionHead title={dict.relatedCoverage} count={dict.sourcesCovering(others.length)} />
              <ul style={{ listStyle: 'none' }}>
                {others.map((a) => (
                  <li key={a.id}>
                    <ArticleCompact article={a} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>

        <aside className={s.rail}>
          {source ? (
            <div className={s.panel}>
              <h2 className={s.panelTitle}>{dict.nav.sources}</h2>
              <div className={s.sourceRow}>
                <span className={s.sourceName}>{source.name}</span>
                <span className="mono" style={{ color: 'var(--text-faint)' }}>
                  {source.country} · {dict.tierLabel[source.tier]}
                </span>
              </div>
              <p className={s.panelBody}>{source.about[lang]}</p>
              <p className={s.panelBody}>
                <strong>{dict.funding}:</strong> {source.funding[lang]}
              </p>
              {source.tier === 3 ? (
                <p className={s.panelBody}>{dict.perspectiveWarning}</p>
              ) : null}
              <Link href="/sources" className="mono" style={{ color: 'var(--text-muted)' }}>
                {dict.sourcesTitle} →
              </Link>
            </div>
          ) : null}

          {moreFromSource.length > 0 ? (
            <div>
              <SectionHead title={dict.moreFrom(source?.short ?? '')} />
              <ul style={{ listStyle: 'none' }}>
                {moreFromSource.map((a) => (
                  <li key={a.id}>
                    <ArticleCompact article={a} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
