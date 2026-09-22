'use client';

import { SOURCES } from '@/lib/sources';
import type { Corpus } from '@/lib/types';
import { useApp, useDict } from '@/components/Providers';
import s from './sources.module.css';

export function SourcesView({
  counts,
  failures,
}: {
  counts: Record<string, number>;
  failures: Corpus['failures'];
}) {
  const dict = useDict();
  const { lang } = useApp();

  const failingSources = new Set(failures.map((f) => f.sourceId));
  const german = SOURCES.filter((src) => src.region === 'de');
  const global = SOURCES.filter((src) => src.region === 'global');

  const renderGroup = (label: string, list: typeof SOURCES) => (
    <>
      <h2 className={s.groupLabel}>{label}</h2>
      <ul className={s.list}>
        {list.map((source) => (
          <li key={source.id} className={s.item}>
            <div className={s.identity}>
              <span className={s.name}>{source.name}</span>
              <span className={s.tag}>
                {source.country} · {dict.tierLabel[source.tier]}
              </span>
              <span className={s.tag}>
                {dict.feedCount(source.feeds.length)} ·{' '}
                {dict.articlesCount(counts[source.id] ?? 0)}
                {failingSources.has(source.id) ? ' · ⚠' : ''}
              </span>
              <a
                className={s.homepage}
                href={source.homepage}
                target="_blank"
                rel="noopener noreferrer"
              >
                {source.homepage.replace(/^https?:\/\/(www\.)?/, '')} ↗
              </a>
            </div>

            <div className={s.detail}>
              <p className={s.about}>{source.about[lang]}</p>
              <div className={s.facts}>
                <div className={s.fact}>
                  <span className={s.factLabel}>{dict.ownership}</span>
                  <span className={s.factValue}>{source.ownership[lang]}</span>
                </div>
                <div className={s.fact}>
                  <span className={s.factLabel}>{dict.funding}</span>
                  <span className={s.factValue}>{source.funding[lang]}</span>
                </div>
              </div>
              {source.tier === 3 ? (
                <p className={s.warning}>{dict.perspectiveWarning}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <div className={`${s.page} container`}>
      <header className={s.head}>
        <h1 className={s.title}>{dict.sourcesTitle}</h1>
        <p className={s.intro}>{dict.sourcesIntro}</p>
      </header>

      {renderGroup(dict.regions.de, german)}
      {renderGroup(dict.regions.global, global)}

      <div className={s.excluded}>
        <h2 className={s.excludedTitle}>
          {lang === 'de' ? 'Bewusst nicht enthalten' : 'Deliberately not included'}
        </h2>
        <p className={s.excludedBody}>
          {lang === 'de'
            ? 'Reuters und AP blockieren automatisierte Zugriffe auf ihre Feeds (HTTP 404 bzw. 403). Financial Times und Süddeutsche liefern über RSS nur einen einzelnen Anreißer statt einer Artikelliste. Alle vier wurden geprüft und ausgelassen, weil sie keine brauchbaren Meldungen liefern — nicht, weil sie unzuverlässig wären.'
            : 'Reuters and AP block automated access to their feeds (HTTP 404 and 403 respectively). The Financial Times and Süddeutsche return a single teaser item over RSS rather than an article list. All four were tested and left out because they cannot supply usable items — not because they are unreliable.'}
        </p>
      </div>
    </div>
  );
}
