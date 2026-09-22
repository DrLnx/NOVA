import 'server-only';
import type { Article, Category, Corpus, Region, Story } from './types';
import { SOURCES } from './sources';
import { fetchAll } from './fetch';
import { clusterArticles, toStories } from './cluster';
import { rankStories } from './rank';

/** Matches the route segment revalidate time. */
const TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  corpus: Corpus;
  expires: number;
}

/**
 * Module-level cache, deliberately plain.
 *
 * The corpus is derived from ~32 network calls and a clustering pass, and every
 * page needs the whole thing rather than a slice, so one shared build per
 * interval is both simpler and faster than caching feeds individually. A single
 * in-flight promise means a burst of requests after expiry triggers one rebuild,
 * not thirty.
 */
let cache: CacheEntry | null = null;
let inFlight: Promise<Corpus> | null = null;

async function build(): Promise<Corpus> {
  const results = await fetchAll(SOURCES);

  const seen = new Set<string>();
  const articles: Article[] = [];
  for (const r of results) {
    for (const a of r.articles) {
      // The same piece often appears in both a section feed and the front feed.
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      articles.push(a);
    }
  }
  articles.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  const stories = rankStories(toStories(clusterArticles(articles)));

  const failures = results
    .filter((r) => r.error)
    .map((r) => ({ sourceId: r.sourceId, url: r.url, reason: r.error ?? 'unknown' }));

  return {
    articles,
    stories,
    byId: new Map(articles.map((a) => [a.id, a])),
    storyById: new Map(stories.map((s) => [s.id, s])),
    failures,
    builtAt: new Date().toISOString(),
  };
}

export async function getCorpus(): Promise<Corpus> {
  if (cache && cache.expires > Date.now()) return cache.corpus;
  if (inFlight) return inFlight;

  inFlight = build()
    .then((corpus) => {
      cache = { corpus, expires: Date.now() + TTL_MS };
      return corpus;
    })
    .catch((err) => {
      // Serving a stale corpus beats serving an error page.
      if (cache) return cache.corpus;
      throw err;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function invalidateCorpus(): void {
  cache = null;
}

// ─── Selectors ──────────────────────────────────────────────────────────────

export interface FeedFilter {
  category?: Category;
  region?: Region;
  sourceId?: string;
}

function matches(story: Story, filter: FeedFilter): boolean {
  if (filter.category && story.category !== filter.category) return false;
  if (filter.sourceId && !story.sourceIds.includes(filter.sourceId)) return false;
  if (filter.region) {
    const hasRegion = story.articles.some((a) => a.region === filter.region);
    if (!hasRegion) return false;
  }
  return true;
}

export async function getStories(filter: FeedFilter = {}, limit?: number): Promise<Story[]> {
  const { stories } = await getCorpus();
  const out = stories.filter((s) => matches(s, filter));
  return limit ? out.slice(0, limit) : out;
}

export async function getStory(id: string): Promise<Story | undefined> {
  return (await getCorpus()).storyById.get(id);
}

export async function getArticle(id: string): Promise<Article | undefined> {
  return (await getCorpus()).byId.get(id);
}

/** The story an article belongs to, so an article page can offer other coverage. */
export async function getStoryForArticle(articleId: string): Promise<Story | undefined> {
  const { stories } = await getCorpus();
  return stories.find((s) => s.articles.some((a) => a.id === articleId));
}

export async function getCounts(): Promise<{
  articles: number;
  stories: number;
  sources: number;
  multiSource: number;
  byCategory: Record<Category, number>;
}> {
  const { articles, stories } = await getCorpus();
  const byCategory = {} as Record<Category, number>;
  for (const s of stories) byCategory[s.category] = (byCategory[s.category] ?? 0) + 1;
  return {
    articles: articles.length,
    stories: stories.length,
    sources: new Set(articles.map((a) => a.sourceId)).size,
    multiSource: stories.filter((s) => s.sourceIds.length > 1).length,
    byCategory,
  };
}
