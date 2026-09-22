'use client';

import Link from 'next/link';
import type { Article } from '@/lib/types';
import { getSource } from '@/lib/sources';
import { textFor } from '@/lib/i18n';
import { useApp } from './Providers';
import {
  BookmarkButton, CategoryTag, ImageTile, Separator, SourceBadge, Timestamp,
  TranslationMark,
} from './primitives';
import s from './cards.module.css';

export function ArticleRow({ article, showCategory = true }: { article: Article; showCategory?: boolean }) {
  const { lang } = useApp();
  const text = textFor(article, lang);

  return (
    <article className={s.row}>
      <div className={s.rowBody}>
        <div className={s.meta}>
          <SourceBadge sourceId={article.sourceId} />
          <Separator />
          <Timestamp iso={article.publishedAt} />
          {showCategory ? (
            <>
              <Separator />
              <CategoryTag category={article.category} />
            </>
          ) : null}
          <TranslationMark text={text} />
        </div>

        <h3 className={s.headline}>
          <Link href={`/article/${article.id}`} className={s.stretch}>
            {text.title}
          </Link>
        </h3>

        {text.summary ? <p className={s.summary}>{text.summary}</p> : null}
      </div>

      <div className={s.rowImage}>
        <ImageTile
          src={article.image}
          alt=""
          sourceId={article.sourceId}
          width={336}
          height={224}
          sizes="168px"
        />
      </div>

      <div style={{ position: 'absolute', right: 0, bottom: 'var(--s4)', zIndex: 1 }}>
        <BookmarkButton article={article} />
      </div>
    </article>
  );
}

/** Dense variant for rails and related-coverage lists. */
export function ArticleCompact({ article }: { article: Article }) {
  const { lang } = useApp();
  const text = textFor(article, lang);
  const source = getSource(article.sourceId);

  return (
    <article className={s.compact}>
      <div className={s.meta}>
        <SourceBadge sourceId={article.sourceId} />
        <Separator />
        <Timestamp iso={article.publishedAt} />
        <TranslationMark text={text} />
      </div>
      <h3 className={s.compactTitle}>
        <Link href={`/article/${article.id}`} className={s.stretch}>
          {text.title}
        </Link>
      </h3>
      <span className="visually-hidden">{source?.name}</span>
    </article>
  );
}

export function ArticleFeed({ articles, showCategory = true }: { articles: Article[]; showCategory?: boolean }) {
  return (
    <ul className={s.list}>
      {articles.map((article) => (
        <li key={article.id}>
          <ArticleRow article={article} showCategory={showCategory} />
        </li>
      ))}
    </ul>
  );
}
