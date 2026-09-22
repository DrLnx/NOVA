import Link from 'next/link';
import type { Article } from '@/lib/types';
import { getSource } from '@/lib/sources';
import {
  BookmarkButton, CategoryTag, ImageTile, Separator, SourceBadge, Timestamp,
} from './primitives';
import s from './cards.module.css';

export function ArticleRow({ article, showCategory = true }: { article: Article; showCategory?: boolean }) {
  return (
    <article className={s.row}>
      <div className={s.rowBody}>
        <div className={s.rowMeta}>
          <SourceBadge sourceId={article.sourceId} />
          <Separator />
          <Timestamp iso={article.publishedAt} />
          {showCategory ? (
            <>
              <Separator />
              <CategoryTag category={article.category} />
            </>
          ) : null}
        </div>

        <h3 className={s.rowTitle}>
          <Link href={`/article/${article.id}`} className={s.stretch}>
            {article.title}
          </Link>
        </h3>

        {article.summary ? <p className={s.rowSummary}>{article.summary}</p> : null}

        <div className={s.rowFoot}>
          <span />
          <BookmarkButton article={article} />
        </div>
      </div>

      <div className={s.rowImage}>
        <ImageTile
          src={article.image}
          alt=""
          sourceId={article.sourceId}
          width={264}
          height={176}
          sizes="132px"
        />
      </div>
    </article>
  );
}

/** Dense variant for sidebars and related-coverage lists. */
export function ArticleCompact({ article }: { article: Article }) {
  const source = getSource(article.sourceId);
  return (
    <article className={s.compact}>
      <div className={s.rowMeta}>
        <SourceBadge sourceId={article.sourceId} />
        <Separator />
        <Timestamp iso={article.publishedAt} />
      </div>
      <h3 className={s.compactTitle}>
        <Link href={`/article/${article.id}`} className={s.stretch}>
          {article.title}
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
