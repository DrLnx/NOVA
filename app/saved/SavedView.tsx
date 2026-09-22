'use client';

import type { Article } from '@/lib/types';
import { useApp, useDict } from '@/components/Providers';
import { ArticleFeed } from '@/components/ArticleCard';
import s from '@/app/search/search.module.css';

export function SavedView({ articles }: { articles: Article[] }) {
  const dict = useDict();
  const { saved, hydrated } = useApp();

  // Preserve the order the reader saved them in, newest first.
  const byId = new Map(articles.map((a) => [a.id, a]));
  const items = saved
    .map((id) => byId.get(id))
    .filter((a): a is Article => a !== undefined);

  const missing = saved.length - items.length;

  return (
    <div className={`${s.page} container`}>
      <header className={s.head}>
        <h1 className={s.title}>{dict.savedTitle}</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--s3)', maxWidth: '54ch' }}>
          {dict.savedIntro}
        </p>
      </header>

      {!hydrated ? null : items.length === 0 ? (
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
