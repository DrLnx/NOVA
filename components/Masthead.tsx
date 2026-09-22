'use client';

import { useDict } from './Providers';
import s from '@/app/page.module.css';

export function Masthead({
  title,
  subtitle,
  builtAt,
  failureCount,
}: {
  title?: string;
  subtitle?: string;
  builtAt?: string;
  failureCount?: number;
}) {
  const dict = useDict();
  return (
    <div className={s.masthead}>
      <div>
        <h1 className={s.mastheadTitle}>{title ?? dict.topStories}</h1>
        <p className={s.mastheadSub}>{subtitle ?? dict.subtitle}</p>
      </div>
      {builtAt ? (
        <div className={s.status}>
          <span className={`${s.statusLine} ${s.live}`}>
            <span className={s.pulse} aria-hidden />
            {dict.updated}
          </span>
          {failureCount ? (
            <span className={s.statusLine}>{dict.sourcesUnavailable(failureCount)}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, body }: { title?: string; body?: string }) {
  const dict = useDict();
  return (
    <div className={s.empty}>
      <p className={s.emptyTitle}>{title ?? dict.noArticles}</p>
      <p className={s.emptyBody}>{body ?? dict.noArticlesHint}</p>
    </div>
  );
}

export function RailNote({ children }: { children: React.ReactNode }) {
  return <p className={s.railNote}>{children}</p>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className={s.notice}>{children}</p>;
}
