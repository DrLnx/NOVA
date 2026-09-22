'use client';

import type { Article } from '@/lib/types';
import { ArticleCompact } from './ArticleCard';
import { SectionHead } from './primitives';
import { useDict } from './Providers';
import s from '@/app/page.module.css';

/** A straight reverse-chronological column, as a counterweight to the ranked feed. */
export function LatestRail({ articles }: { articles: Article[] }) {
  const dict = useDict();
  if (articles.length === 0) return null;
  return (
    <div>
      <SectionHead title={dict.latest} />
      <ul style={{ listStyle: 'none' }}>
        {articles.map((a) => (
          <li key={a.id}>
            <ArticleCompact article={a} />
          </li>
        ))}
      </ul>
    </div>
  );
}
