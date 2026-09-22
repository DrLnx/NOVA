'use client';

import { useEffect, useState } from 'react';
import type { Article } from '@/lib/types';
import { useApp, useDict } from '@/components/Providers';
import { ArticleFeed } from '@/components/ArticleCard';
import s from '@/app/search/search.module.css';

export function SavedView() {
  const dict = useDict();
  const { saved, hydrated } = useApp();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (saved.length === 0) {
      setArticles([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/articles?ids=${saved.join(',')}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { results: Article[] }) => setArticles(data.results ?? []))
      .catch(() => {
        /* offline or aborted */
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [saved, hydrated]);

  // Keep the reader's own order, newest save first.
  const byId = new Map(articles.map((a) => [a.id, a]));
  const items = saved.map((id) => byId.get(id)).filter((a): a is Article => a !== undefined);
  const missing = hydrated && !loading ? saved.length - items.length : 0;

  return (
    <div className={`${s.page} container`}>
      <header className={s.head}>
        <h1 className={s.title}>{dict.savedTitle}</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--s3)', maxWidth: '54ch' }}>
          {dict.savedIntro}
        </p>
      </header>

      {!hydrated || loading ? (
        <p className={s.loading}>···</p>
      ) : items.length === 0 ? (
        <div className={s.empty}>
          <p className={s.emptyTitle}>{dict.savedEmpty}</p>
          <p className={s.emptyBody}>{dict.savedEmptyHint}</p>
        </div>
      ) : (
        <>
          <p className={s.count}>
            {dict.articlesCount(items.length)}
            {missing > 0 ? ` · ${missing} ${dict.notFound.toLowerCase()}` : ''}
          </p>
          <ArticleFeed articles={items} />
        </>
      )}
    </div>
  );
}
