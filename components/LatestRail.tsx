'use client';

import type { Article } from '@/lib/types';
import { ArticleCompact } from './ArticleCard';
import { SectionHeading } from './DateBar';
import { useDict } from './Providers';

/** A straight reverse-chronological column, as a counterweight to the ranked feed. */
export function LatestRail({ articles }: { articles: Article[] }) {
  const dict = useDict();
  if (articles.length === 0) return null;
  return (
    <div>
      <SectionHeading title={dict.latest} />
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
