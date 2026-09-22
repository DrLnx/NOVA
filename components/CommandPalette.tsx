'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Article } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';
import { getSource } from '@/lib/sources';
import { useDict } from './Providers';
import s from './CommandPalette.module.css';

const OPEN_EVENT = 'scope:open-palette';

/** Lets the header button open the palette without threading state through the tree. */
export function openCommandPalette(): void {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

interface Command {
  id: string;
  label: string;
  meta?: string;
  href: string;
}

export function CommandPalette() {
  const dict = useDict();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [active, setActive] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setActive(0);
    restoreFocus.current?.focus();
  }, []);

  // ⌘K / Ctrl+K anywhere, and the header button via a custom event.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        restoreFocus.current = document.activeElement as HTMLElement;
        setOpen((v) => !v);
      }
    };
    const onOpen = () => {
      restoreFocus.current = document.activeElement as HTMLElement;
      setOpen(true);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Debounced; an aborted controller stops a slow response overwriting a fast one.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const id = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((data: { results: Article[] }) => {
          setResults(data.results ?? []);
          setActive(0);
        })
        .catch(() => {
          /* aborted or offline — the list simply stays as it is */
        });
    }, 140);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query, open]);

  const q = query.trim().toLowerCase();

  const navCommands: Command[] = [
    { id: 'nav-home', label: dict.nav.home, href: '/' },
    { id: 'nav-briefing', label: dict.nav.briefing, href: '/briefing' },
    { id: 'nav-search', label: dict.nav.search, href: `/search${q ? `?q=${encodeURIComponent(query.trim())}` : ''}` },
    { id: 'nav-sources', label: dict.nav.sources, href: '/sources' },
    { id: 'nav-saved', label: dict.nav.saved, href: '/saved' },
  ].filter((c) => !q || c.label.toLowerCase().includes(q));

  const categoryCommands: Command[] = CATEGORIES.map((c) => ({
    id: `cat-${c}`,
    label: dict.categories[c],
    href: `/category/${c}`,
  })).filter((c) => !q || c.label.toLowerCase().includes(q));

  const articleCommands: Command[] = results.map((a) => ({
    id: `art-${a.id}`,
    label: a.title,
    meta: getSource(a.sourceId)?.short ?? '',
    href: `/article/${a.id}`,
  }));

  const all = [...navCommands, ...categoryCommands, ...articleCommands];

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (all.length ? (i + 1) % all.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (all.length ? (i - 1 + all.length) % all.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = all[active];
      if (target) go(target.href);
    }
  };

  // Keep the highlighted row in view when arrowing through a long list.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  let index = -1;
  const renderGroup = (label: string, commands: Command[]) => {
    if (commands.length === 0) return null;
    return (
      <div key={label} role="group" aria-label={label}>
        <div className={s.groupLabel}>{label}</div>
        {commands.map((c) => {
          index += 1;
          const i = index;
          return (
            <button
              key={c.id}
              type="button"
              data-index={i}
              className={`${s.item} ${i === active ? s.itemActive : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(c.href)}
              role="option"
              aria-selected={i === active}
            >
              <span className={s.itemTitle}>{c.label}</span>
              {c.meta ? <span className={s.itemMeta}>{c.meta}</span> : null}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={s.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={dict.commandPalette}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className={s.panel} onKeyDown={onKeyDown}>
        <div className={s.inputRow}>
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden>
            <circle cx="6.2" cy="6.2" r="4" stroke="var(--text-faint)" strokeWidth="1.2" />
            <path d="M9.2 9.2 12.5 12.5" stroke="var(--text-faint)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className={s.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.commandHint}
            aria-label={dict.searchTitle}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className={s.esc}>ESC</kbd>
        </div>

        <div className={s.results} ref={listRef} role="listbox" aria-label={dict.commandPalette}>
          {all.length === 0 ? (
            <p className={s.empty}>{query.trim().length < 2 ? dict.searchHint : dict.commandEmpty}</p>
          ) : (
            <>
              {renderGroup(dict.commandNav, navCommands)}
              {renderGroup(dict.commandCategories, categoryCommands)}
              {renderGroup(dict.commandResults, articleCommands)}
            </>
          )}
        </div>

        <div className={s.foot}>
          <span className={s.hint}>
            <kbd className={s.hintKey}>↑↓</kbd> {dict.navigate}
          </span>
          <span className={s.hint}>
            <kbd className={s.hintKey}>↵</kbd> {dict.open}
          </span>
          <span className={s.hint}>
            <kbd className={s.hintKey}>ESC</kbd> {dict.close}
          </span>
        </div>
      </div>
    </div>
  );
}
