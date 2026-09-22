'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Article } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';
import { SOURCES } from '@/lib/sources';
import { useDict } from '@/components/Providers';
import { ArticleFeed } from '@/components/ArticleCard';
import s from './search.module.css';

const TIMEFRAMES = [24, 72, 168] as const;

export function SearchView() {
  const dict = useDict();
  const router = useRouter();
  const params = useSearchParams();

  const [query, setQuery] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [source, setSource] = useState(params.get('source') ?? '');
  const [region, setRegion] = useState(params.get('region') ?? '');
  const [within, setWithin] = useState(params.get('within') ?? '');

  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const hasFilters = Boolean(category || source || region || within);

  // Debounced fetch, with the URL kept in step so a search is shareable and
  // survives a reload.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 && !hasFilters) {
      setResults([]);
      setSearched(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const id = setTimeout(() => {
      const search = new URLSearchParams();
      if (q) search.set('q', q);
      if (category) search.set('category', category);
      if (source) search.set('source', source);
      if (region) search.set('region', region);
      if (within) search.set('within', within);

      router.replace(`/search${search.toString() ? `?${search}` : ''}`, { scroll: false });

      fetch(`/api/search?${search.toString()}&limit=60`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((data: { results: Article[] }) => {
          setResults(data.results ?? []);
          setSearched(true);
        })
        .catch(() => {
          /* aborted or offline */
        })
        .finally(() => setLoading(false));
    }, 180);

    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query, category, source, region, within, hasFilters, router]);

  const reset = useCallback(() => {
    setCategory('');
    setSource('');
    setRegion('');
    setWithin('');
  }, []);

  const timeframeLabel = (hours: string) =>
    hours === '24' ? dict.last24h : hours === '72' ? dict.last3d : dict.last7d;

  return (
    <div className={`${s.page} container`}>
      <header className={s.head}>
        <h1 className={s.title}>{dict.searchTitle}</h1>
        <div className={s.inputWrap}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
            <circle cx="6.2" cy="6.2" r="4" stroke="var(--text-faint)" strokeWidth="1.2" />
            <path d="M9.2 9.2 12.5 12.5" stroke="var(--text-faint)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className={s.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.searchPlaceholder}
            aria-label={dict.searchTitle}
            autoComplete="off"
            spellCheck={false}
          />
          {query ? (
            <button type="button" className={s.clear} onClick={() => setQuery('')} aria-label={dict.close}>
              ✕
            </button>
          ) : null}
        </div>
      </header>

      <div className={s.filters}>
        <select
          className={`${s.select} ${category ? s.selectActive : ''}`}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label={dict.allCategories}
        >
          <option value="">{dict.allCategories}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {dict.categories[c]}
            </option>
          ))}
        </select>

        <select
          className={`${s.select} ${source ? s.selectActive : ''}`}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          aria-label={dict.allSources}
        >
          <option value="">{dict.allSources}</option>
          {SOURCES.map((src) => (
            <option key={src.id} value={src.id}>
              {src.name}
            </option>
          ))}
        </select>

        <select
          className={`${s.select} ${region ? s.selectActive : ''}`}
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label={dict.regions.all}
        >
          <option value="">{dict.regions.all}</option>
          <option value="de">{dict.regions.de}</option>
          <option value="global">{dict.regions.global}</option>
        </select>

        <select
          className={`${s.select} ${within ? s.selectActive : ''}`}
          value={within}
          onChange={(e) => setWithin(e.target.value)}
          aria-label={dict.timeframe}
        >
          <option value="">{dict.anyTime}</option>
          {TIMEFRAMES.map((h) => (
            <option key={h} value={String(h)}>
              {timeframeLabel(String(h))}
            </option>
          ))}
        </select>

        {hasFilters ? (
          <button type="button" className={s.reset} onClick={reset}>
            {dict.clearFilters}
          </button>
        ) : null}
      </div>

      {loading && results.length === 0 ? (
        <p className={s.loading}>···</p>
      ) : results.length > 0 ? (
        <>
          <p className={s.count}>{dict.resultsCount(results.length)}</p>
          <ArticleFeed articles={results} />
        </>
      ) : searched ? (
        <div className={s.empty}>
          <p className={s.emptyTitle}>{dict.noResults}</p>
          <p className={s.emptyBody}>{dict.noResultsHint}</p>
        </div>
      ) : (
        <div className={s.empty}>
          <p className={s.emptyBody}>{dict.searchHint}</p>
        </div>
      )}
    </div>
  );
}
