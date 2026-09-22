'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Lang } from '@/lib/types';
import { DEFAULT_LANG, getDict, type Dict } from '@/lib/i18n';

type Theme = 'light' | 'dark';

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  dict: Dict;
  theme: Theme;
  toggleTheme: () => void;
  saved: string[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  hydrated: boolean;
}

const Ctx = createContext<AppState | null>(null);

const LANG_KEY = 'scope.lang';
const THEME_KEY = 'scope.theme';
const SAVED_KEY = 'scope.saved';

/**
 * Browser storage can throw in private windows and with site data blocked, so
 * every access is guarded and the app renders correctly when it comes back empty.
 */
function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* preference simply will not persist */
  }
}

export function Providers({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  const [theme, setTheme] = useState<Theme>('light');
  const [saved, setSaved] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // The inline script in the document head has already applied the theme to
  // <html> before paint; this only syncs React's copy of that state.
  useEffect(() => {
    const storedLang = readStorage(LANG_KEY);
    if (storedLang === 'de' || storedLang === 'en') setLangState(storedLang);

    const current = document.documentElement.dataset['theme'];
    setTheme(current === 'dark' ? 'dark' : 'light');

    const storedSaved = readStorage(SAVED_KEY);
    if (storedSaved) {
      try {
        const parsed: unknown = JSON.parse(storedSaved);
        if (Array.isArray(parsed)) setSaved(parsed.filter((x): x is string => typeof x === 'string'));
      } catch {
        /* corrupt value, start clean */
      }
    }

    setHydrated(true);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    writeStorage(LANG_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset['theme'] = next;
      writeStorage(THEME_KEY, next);
      return next;
    });
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      writeStorage(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<AppState>(
    () => ({
      lang,
      setLang,
      dict: getDict(lang),
      theme,
      toggleTheme,
      saved,
      isSaved: (id: string) => saved.includes(id),
      toggleSaved,
      hydrated,
    }),
    [lang, setLang, theme, toggleTheme, saved, toggleSaved, hydrated],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside <Providers>');
  return ctx;
}

/** Convenience for the common case of only needing strings. */
export function useDict(): Dict {
  return useApp().dict;
}
