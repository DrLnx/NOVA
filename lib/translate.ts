// Server-side only. The boundary is enforced by corpus.ts, which imports this
// module and carries the 'server-only' guard; keeping it out of here lets the
// inspection scripts exercise the translation path directly.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Lang } from './types';
import { hashId } from './text';

/**
 * Headline translation, used only where a story has no article in the reader's
 * language at all.
 *
 * Roughly 60% of the stories on a front page already contain a German article,
 * and for those SCOPE shows the German newsroom's own words — real journalism
 * beats machine translation every time. This module exists for the remainder.
 *
 * Translations are cached on disk permanently and keyed by content hash, so a
 * given headline is sent once and never again. Every failure path returns null
 * and the caller falls back to the original text with a visible marker.
 */

const ENDPOINT = 'https://api.mymemory.translated.net/get';
const CACHE_FILE = join(process.cwd(), '.scope-cache', 'translations.json');
/** MyMemory rejects queries much longer than this. */
const MAX_CHARS = 480;
const TIMEOUT_MS = 6000;
/**
 * Rolling rate limit rather than a fixed per-build counter.
 *
 * A build-scoped counter starved every later request: the corpus build spent
 * the whole allowance, and story pages opened minutes afterwards then had none
 * left and silently fell back to English. A refilling window protects the free
 * service while still letting on-demand localization through.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 140;

type CacheMap = Record<string, string>;

let memory: CacheMap | null = null;
let loading: Promise<CacheMap> | null = null;
let dirty = false;
/** Timestamps of recent calls, trimmed to the rolling window. */
let recent: number[] = [];
/** Set when the provider reports its quota is gone; no further calls this process. */
let quotaExhausted = false;

async function loadCache(): Promise<CacheMap> {
  if (memory) return memory;
  if (loading) return loading;
  loading = readFile(CACHE_FILE, 'utf8')
    .then((raw) => JSON.parse(raw) as CacheMap)
    .catch(() => ({}))
    .then((map) => {
      memory = map;
      return map;
    })
    .finally(() => {
      loading = null;
    });
  return loading;
}

export async function flushCache(): Promise<void> {
  if (!dirty || !memory) return;
  try {
    await mkdir(dirname(CACHE_FILE), { recursive: true });
    await writeFile(CACHE_FILE, JSON.stringify(memory), 'utf8');
    dirty = false;
  } catch {
    /* a cache we cannot persist is still a cache for this process */
  }
}

function withinRateLimit(): boolean {
  const cutoff = Date.now() - WINDOW_MS;
  recent = recent.filter((t) => t > cutoff);
  return recent.length < MAX_PER_WINDOW;
}

/** Kept for call-site clarity; the limiter is time-based and self-trimming. */
export function beginTranslationBudget(): void {
  recent = recent.filter((t) => t > Date.now() - WINDOW_MS);
}

function cacheKey(text: string, from: Lang, to: Lang): string {
  return `${from}${to}:${hashId(text)}`;
}

/** MyMemory signals quota exhaustion inside the payload rather than by status. */
function isProviderError(value: string): boolean {
  return /MYMEMORY WARNING|QUOTA|ALL AVAILABLE FREE TRANSLATIONS|INVALID/i.test(value);
}

export async function translate(text: string, from: Lang, to: Lang): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed || from === to) return null;

  const cache = await loadCache();
  const key = cacheKey(trimmed, from, to);
  const cached = cache[key];
  if (cached !== undefined) return cached === '' ? null : cached;

  if (quotaExhausted || !withinRateLimit()) return null;
  recent.push(Date.now());

  const query = trimmed.length > MAX_CHARS ? trimmed.slice(0, MAX_CHARS) : trimmed;

  try {
    const url = `${ENDPOINT}?q=${encodeURIComponent(query)}&langpair=${from}|${to}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number | string;
      responseDetails?: string;
    };

    const out = data.responseData?.translatedText?.trim();
    if (!out || isProviderError(out) || isProviderError(data.responseDetails ?? '')) {
      if (isProviderError(out ?? '') || isProviderError(data.responseDetails ?? '')) {
        quotaExhausted = true;
      }
      return null;
    }
    if (String(data.responseStatus) !== '200') return null;

    // A "translation" identical to the input means the provider did nothing.
    if (out.toLowerCase() === trimmed.toLowerCase()) {
      cache[key] = '';
      dirty = true;
      return null;
    }

    cache[key] = out;
    dirty = true;
    return out;
  } catch {
    return null;
  }
}
