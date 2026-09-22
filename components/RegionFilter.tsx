'use client';

import Link from 'next/link';
import { useDict } from './Providers';
import s from '@/app/page.module.css';

/**
 * Region is a filter on where the *publisher* sits, which is a different axis
 * from the category (what the story is about). Both apply at once.
 */
export function RegionFilter({
  basePath,
  active,
}: {
  basePath: string;
  active: 'all' | 'de' | 'global';
}) {
  const dict = useDict();
  const options = [
    { key: 'all' as const, label: dict.regions.all, href: basePath },
    { key: 'de' as const, label: dict.regions.de, href: `${basePath}?region=de` },
    { key: 'global' as const, label: dict.regions.global, href: `${basePath}?region=global` },
  ];

  return (
    <div className={s.segmented} role="group" aria-label={dict.filters}>
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.href}
          className={`${s.segment} ${active === o.key ? s.segmentActive : ''}`}
          aria-current={active === o.key ? 'true' : undefined}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
