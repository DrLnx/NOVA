import type { Article, Source } from './types';
import { parseFeed } from './parse';
import { normalize } from './normalize';

const USER_AGENT =
  'Mozilla/5.0 (compatible; SCOPE/1.0; personal news reader; +https://github.com/n3xtpy)';

const FEED_TIMEOUT_MS = 8000;

export interface FeedResult {
  sourceId: string;
  url: string;
  articles: Article[];
  error?: string;
}

/**
 * Fetch and normalise one feed. Never throws — a failing source degrades the
 * feed by its own items only, and the reason is carried through to the UI so a
 * silently empty section is impossible.
 */
export async function fetchFeed(source: Source, feedIndex: number): Promise<FeedResult> {
  const feed = source.feeds[feedIndex];
  if (!feed) return { sourceId: source.id, url: '', articles: [], error: 'no such feed' };

  try {
    const res = await fetch(feed.url, {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
        'accept-language': source.lang === 'de' ? 'de-DE,de;q=0.9,en;q=0.5' : 'en-GB,en;q=0.9',
      },
      signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
      // Next revalidates the whole corpus on a timer; per-request caching here
      // would only pin stale bytes inside that window.
      cache: 'no-store',
    });

    if (!res.ok) {
      return { sourceId: source.id, url: feed.url, articles: [], error: `HTTP ${res.status}` };
    }

    const xml = await res.text();
    const raw = parseFeed(xml);
    if (raw.length === 0) {
      return { sourceId: source.id, url: feed.url, articles: [], error: 'no items parsed' };
    }

    const now = Date.now();
    const articles: Article[] = [];
    for (const item of raw) {
      const article = normalize(item, source, feed, now);
      if (article) articles.push(article);
    }

    return { sourceId: source.id, url: feed.url, articles };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === 'TimeoutError' || err.name === 'AbortError'
          ? `timeout after ${FEED_TIMEOUT_MS}ms`
          : err.message
        : 'unknown error';
    return { sourceId: source.id, url: feed.url, articles: [], error: message };
  }
}

/** All feeds of all sources, in parallel. One slow feed cannot block the rest. */
export async function fetchAll(sources: Source[]): Promise<FeedResult[]> {
  const jobs: Promise<FeedResult>[] = [];
  for (const source of sources) {
    for (let i = 0; i < source.feeds.length; i++) {
      jobs.push(fetchFeed(source, i));
    }
  }
  return Promise.all(jobs);
}
