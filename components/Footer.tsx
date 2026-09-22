'use client';

import Link from 'next/link';
import { CATEGORIES } from '@/lib/types';
import { useDict } from './Providers';
import s from './Footer.module.css';

export function Footer() {
  const dict = useDict();
  return (
    <footer className={s.footer}>
      <div className="container">
        <div className={s.inner}>
          <div>
            <div className={s.brand}>SCOPE</div>
            <p className={s.note}>{dict.footerNote}</p>
            <p className={s.legal}>{dict.excerptNotice}</p>
          </div>

          <nav className={s.links} aria-label={dict.nav.home}>
            <Link href="/briefing" className={s.link}>{dict.nav.briefing}</Link>
            <Link href="/search" className={s.link}>{dict.nav.search}</Link>
            <Link href="/sources" className={s.link}>{dict.nav.sources}</Link>
            <Link href="/saved" className={s.link}>{dict.nav.saved}</Link>
          </nav>

          <nav className={s.links} aria-label={dict.commandCategories}>
            {CATEGORIES.map((c) => (
              <Link key={c} href={`/category/${c}`} className={s.link}>
                {dict.categories[c]}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
