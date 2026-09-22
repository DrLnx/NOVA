'use client';

import Link from 'next/link';
import { useDict } from './Providers';
import s from './StatusPages.module.css';

export function NotFoundBody() {
  const dict = useDict();
  return (
    <div className={s.wrap}>
      <div className={s.inner}>
        <p className={s.code}>404</p>
        <h1 className={s.title}>{dict.notFound}</h1>
        <p className={s.body}>{dict.notFoundBody}</p>
        <Link href="/" className={s.action}>
          {dict.backToFeed}
        </Link>
      </div>
    </div>
  );
}

export function ErrorBody({ reset }: { reset: () => void }) {
  const dict = useDict();
  return (
    <div className={s.wrap}>
      <div className={s.inner}>
        <p className={s.code}>Error</p>
        <h1 className={s.title}>{dict.errorTitle}</h1>
        <p className={s.body}>{dict.errorBody}</p>
        <button type="button" className={s.action} onClick={reset}>
          {dict.retry}
        </button>
      </div>
    </div>
  );
}
