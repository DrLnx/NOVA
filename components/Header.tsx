'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CATEGORIES } from '@/lib/types';
import { useApp, useDict } from './Providers';
import { openCommandPalette } from './CommandPalette';
import s from './Header.module.css';

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M7.5 1v1.5M7.5 12.5V14M14 7.5h-1.5M2.5 7.5H1M12.1 2.9l-1.1 1.1M4 11l-1.1 1.1M12.1 12.1L11 11M4 4L2.9 2.9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path
        d="M13 9.3A6 6 0 0 1 5.7 2a6 6 0 1 0 7.3 7.3Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="6.2" cy="6.2" r="4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9.2 9.2 12.5 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function Header() {
  const { theme, toggleTheme, lang, setLang } = useApp();
  const dict = useDict();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className={s.header}>
      <div className="container">
        <div className={s.bar}>
          <Link href="/" className={s.brand} aria-label="SCOPE — home">
            SCOPE
          </Link>

          <nav className={s.nav} aria-label={dict.navigate}>
            <Link href="/briefing" className={`${s.link} ${isActive('/briefing') ? s.linkActive : ''}`}>
              {dict.nav.briefing}
            </Link>
            <Link href="/sources" className={`${s.link} ${isActive('/sources') ? s.linkActive : ''}`}>
              {dict.nav.sources}
            </Link>
            <Link href="/saved" className={`${s.link} ${isActive('/saved') ? s.linkActive : ''}`}>
              {dict.nav.saved}
            </Link>
          </nav>

          <div className={s.actions}>
            <button
              type="button"
              className={s.searchButton}
              onClick={openCommandPalette}
              aria-label={dict.searchTitle}
            >
              <SearchIcon />
              <span className={s.searchLabel}>{dict.commandHint}</span>
              <kbd className={s.kbd}>⌘K</kbd>
            </button>

            <div className={s.langToggle} role="group" aria-label={dict.language}>
              {(['de', 'en'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`${s.langOption} ${lang === l ? s.langActive : ''}`}
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={s.iconButton}
              onClick={toggleTheme}
              aria-label={dict.theme}
              title={dict.theme}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </div>

      <div className={s.strip}>
        <div className="container">
          <div className={s.stripInner}>
            <Link href="/" className={`${s.stripLink} ${pathname === '/' ? s.stripActive : ''}`}>
              {dict.nav.home}
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                href={`/category/${c}`}
                className={`${s.stripLink} ${pathname === `/category/${c}` ? s.stripActive : ''}`}
              >
                {dict.categories[c]}
              </Link>
            ))}

            <span className={s.stripSections}>
              <span className={s.stripDivider} aria-hidden />
              <Link
                href="/briefing"
                className={`${s.stripLink} ${isActive('/briefing') ? s.stripActive : ''}`}
              >
                {dict.nav.briefing}
              </Link>
              <Link
                href="/sources"
                className={`${s.stripLink} ${isActive('/sources') ? s.stripActive : ''}`}
              >
                {dict.nav.sources}
              </Link>
              <Link
                href="/saved"
                className={`${s.stripLink} ${isActive('/saved') ? s.stripActive : ''}`}
              >
                {dict.nav.saved}
              </Link>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
