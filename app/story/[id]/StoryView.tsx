'use client';

import Link from 'next/link';
import type { Story } from '@/lib/types';
import type { GlossaryEntry } from '@/lib/glossary';
import type { AiBriefing } from '@/lib/ai';
import { getSource } from '@/lib/sources';
import { textFor } from '@/lib/i18n';
import { useApp, useDict } from '@/components/Providers';
import {
  BookmarkButton, CategoryTag, ImageTile, Separator, Timestamp, TranslationMark,
  WeightBadge, WeightBreakdown, SectionHead,
} from '@/components/primitives';
import { ArticleCompact } from '@/components/ArticleCard';
import s from './story.module.css';

function ExternalIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M3 1h6v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 1 1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function StoryView({
  story,
  glossary,
  related,
  briefing,
}: {
  story: Story;
  glossary: GlossaryEntry[];
  related: Story[];
  briefing: AiBriefing | null;
}) {
  const dict = useDict();
  const { lang } = useApp();
  const lead = story.articles[0];
  const text = textFor(story, lang);

  return (
    <div className={`${s.page} container`}>
      <Link href="/" className={s.back}>
        ← {dict.backToFeed}
      </Link>

      <header className={s.head}>
        <div>
          <div className={s.meta}>
            <WeightBadge story={story} showLabel />
            <Separator />
            <Timestamp iso={story.lastSeen} />
            <Separator />
            <CategoryTag category={story.category} />
            <TranslationMark text={text} />
          </div>

          <h1 className={s.title}>{text.title}</h1>
          {text.summary ? <p className={s.summary}>{text.summary}</p> : null}
        </div>

        <div className={s.headImage}>
          <ImageTile
            src={story.image}
            alt={story.imageAlt ?? ''}
            sourceId={lead?.sourceId ?? ''}
            width={760}
            height={475}
            sizes="(max-width: 900px) 100vw, 380px"
            priority
          />
        </div>
      </header>

      <div className={s.layout}>
        <div>
          {/* The comparison itself: one event, every newsroom's own words. */}
          <section className={s.section}>
            <SectionHead
              title={dict.allCoverage}
              count={`${dict.sourcesCovering(story.sourceIds.length)} · ${dict.countriesCount(story.countries.length)}`}
            />
            <p className={s.panelNote} style={{ marginBottom: 'var(--s5)' }}>
              {dict.framingNote}
            </p>

            <ul className={s.compare}>
              {story.articles.map((article) => {
                const source = getSource(article.sourceId);
                const entry = textFor(article, lang);
                const showOriginal = entry.title !== article.title;
                return (
                  <li key={article.id}>
                    <article className={s.entry}>
                      <div className={s.entrySource}>
                        <span className={s.entrySourceName}>{source?.short}</span>
                        <span className={s.entryLine}>
                          {source?.country} · {dict.tierLabel[source?.tier ?? 3]}
                        </span>
                        <Timestamp iso={article.publishedAt} />
                        {source?.tier === 3 ? (
                          <span className={s.perspective}>{dict.perspectiveWarning.split('.')[0]}</span>
                        ) : null}
                      </div>

                      <div className={s.entryBody}>
                        <h2 className={s.entryTitle}>
                          <Link href={`/article/${article.id}`}>{entry.title}</Link>
                        </h2>
                        {showOriginal ? (
                          <p className={s.entryOriginal}>
                            <span className={s.entryOriginalLabel}>{dict.originalHeadline}</span>
                            {article.title}
                          </p>
                        ) : null}
                        {entry.summary ? (
                          <p className={s.entrySummary}>{entry.summary}</p>
                        ) : null}
                        <div className={s.entryFoot}>
                          <a
                            className={s.outLink}
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {dict.readAt(source?.name ?? '')} <ExternalIcon />
                          </a>
                          <BookmarkButton article={article} />
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </section>

          {related.length > 0 ? (
            <section className={s.section}>
              <SectionHead title={dict.relatedCoverage} />
              <ul style={{ listStyle: 'none' }}>
                {related.map((r) => {
                  const a = r.articles[0];
                  return a ? (
                    <li key={r.id}>
                      <ArticleCompact article={a} />
                    </li>
                  ) : null;
                })}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className={s.rail}>
          {/* Why it matters, with nothing generated and nothing to caveat. */}
          <div className={s.panel}>
            <h2 className={s.panelTitle}>{dict.whyItMatters}</h2>
            <p className={s.panelNote}>
              {dict.coverageSpreadBody(story.sourceIds.length, story.countries.length)}
            </p>
            <WeightBreakdown story={story} />
            <p className={s.panelFoot}>{dict.weightNote}</p>
          </div>

          {briefing ? (
            <div className={s.panel}>
              <h2 className={s.panelTitle}>{dict.aiBriefing}</h2>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
                {briefing.points.map((point) => (
                  <li key={point} className={s.panelNote}>
                    {point}
                  </li>
                ))}
              </ul>
              <p className={s.panelFoot}>{dict.aiNotice(briefing.model)}</p>
            </div>
          ) : null}

          {glossary.length > 0 ? (
            <div className={s.panel}>
              <h2 className={s.panelTitle}>{dict.background}</h2>
              {glossary.map((entry) => (
                <div key={entry.id} className={s.glossaryItem}>
                  <span className={s.glossaryTerm}>{entry.term[lang]}</span>
                  <p className={s.glossaryBody}>{entry.body[lang]}</p>
                </div>
              ))}
              <p className={s.panelFoot}>{dict.backgroundNote}</p>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
