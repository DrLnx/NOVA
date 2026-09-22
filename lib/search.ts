import type { Article, Category, Region } from './types';
import { fold } from './text';
import { ALIAS_EXPANSIONS, STOPWORDS } from './linguistics';

export interface SearchFilters {
  category?: Category;
  sourceId?: string;
  region?: Region;
  /** Only articles newer than this many hours. */
  withinHours?: number;
}

export interface SearchHit {
  article: Article;
  score: number;
}

/**
 * Query terms keep stopwords out but, unlike clustering, keep short tokens:
 * someone searching "EU" or "KI" means exactly that.
 */
function queryTerms(query: string): string[] {
  return fold(query)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0 && !STOPWORDS.has(t));
}

/**
 * Deliberately a linear scan. The corpus is ~1,200 articles held in memory, so
 * this runs in a couple of milliseconds — an index would be a moving part with
 * nothing to show for it.
 */
export function searchArticles(
  articles: Article[],
  query: string,
  filters: SearchFilters = {},
  limit = 60,
): SearchHit[] {
  const terms = queryTerms(query);
  const phrase = fold(query.trim());
  const cutoff = filters.withinHours ? Date.now() - filters.withinHours * 3_600_000 : null;

  const hits: SearchHit[] = [];

  for (const article of articles) {
    if (filters.category && article.category !== filters.category) continue;
    if (filters.sourceId && article.sourceId !== filters.sourceId) continue;
    if (filters.region && article.region !== filters.region) continue;
    if (cutoff !== null && Date.parse(article.publishedAt) < cutoff) continue;

    // An empty query with filters applied is a valid browse, not a search.
    if (terms.length === 0 && !phrase) {
      hits.push({ article, score: Date.parse(article.publishedAt) / 1e13 });
      continue;
    }

    const title = fold(article.title);
    const summary = fold(article.summary);

    let score = 0;

    // Whole-phrase matches outrank scattered term matches.
    if (phrase.length >= 3) {
      if (title.includes(phrase)) score += 14;
      else if (summary.includes(phrase)) score += 6;
    }

    let matched = 0;
    for (const term of terms) {
      // Expand across languages: "zelensky" also matches "Selenskyj",
      // "ceasefire" also matches "Waffenruhe". An unknown term expands to itself.
      const forms = ALIAS_EXPANSIONS.get(term) ?? [term];
      const inTitle = forms.some((f) => title.includes(f));
      const inSummary = forms.some((f) => summary.includes(f));
      // Only the term the reader actually typed earns the prefix bonus.
      if (inTitle) score += title.startsWith(term) ? 6 : 4;
      if (inSummary) score += 1.5;
      if (inTitle || inSummary) matched++;
    }

    if (matched === 0) continue;
    // Every term present is worth much more than most terms present.
    if (terms.length > 1) score *= 0.55 + 0.45 * (matched / terms.length);

    // A gentle recency nudge, never enough to outrank a better textual match.
    const ageHours = (Date.now() - Date.parse(article.publishedAt)) / 3_600_000;
    score *= 1 + 0.25 * Math.pow(0.5, ageHours / 48);

    hits.push({ article, score });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
