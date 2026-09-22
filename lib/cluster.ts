import type { Article, Category, Story } from './types';
import { fold, hashId } from './text';
import { ALIAS_PHRASES, ALIAS_WORD, COMPOUND_ROOTS, STOPWORDS } from './linguistics';
import { getSource } from './sources';
import { isDigest } from './classify';

/**
 * Tuned against a live 1,189-article corpus with `npm run inspect:clusters`,
 * scored on groupings verified by eye.
 *
 *   0.34 → 72 multi-source stories, 10 spanning DE and international outlets
 *   0.40 → 61 and 7, and it splits a genuine five-outlet story apart
 *
 * Tightening trades away the cross-language grouping this whole site exists to
 * show. The cost of staying loose is that a couple of same-day UN General
 * Assembly speeches share one story; the cost of tightening is that a real story
 * covered by five outlets is torn into fragments. The first failure still shows
 * the reader related coverage — the second hides it.
 */
export const SIMILARITY_THRESHOLD = 0.34;
/** Two articles can only belong to the same story if published within this window. */
const WINDOW_MS = 72 * 60 * 60 * 1000;
/** The title carries the event; the summary only supports it. */
const TITLE_WEIGHT = 3;

export type Vector = Map<string, number>;

/**
 * Fold, bridge cross-language aliases, drop stopwords, and split long German
 * compounds down to any canonical root they contain.
 */
export function tokenize(text: string): string[] {
  let s = ` ${fold(text)} `;
  for (const [rx, canonical] of ALIAS_PHRASES) {
    rx.lastIndex = 0;
    s = s.replace(rx, canonical);
  }

  const out: string[] = [];
  for (const rawToken of s.split(/[^a-z0-9]+/)) {
    if (!rawToken) continue;

    const alias = ALIAS_WORD.get(rawToken);
    if (alias) {
      out.push(alias);
      continue;
    }

    if (STOPWORDS.has(rawToken)) continue;

    // Years and other multi-digit figures are strong event markers; lone digits are noise.
    if (/^\d+$/.test(rawToken)) {
      if (rawToken.length >= 3) out.push(rawToken);
      continue;
    }

    if (rawToken.length < 4) continue;
    out.push(rawToken);

    // "Ukrainehilfen" also contributes "ukraine".
    if (rawToken.length >= 9) {
      for (const { root, canonical } of COMPOUND_ROOTS) {
        if (root.length < rawToken.length && rawToken.includes(root)) {
          out.push(canonical);
          break;
        }
      }
    }
  }
  return out;
}

function termFrequency(article: Article): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokenize(article.title)) tf.set(t, (tf.get(t) ?? 0) + TITLE_WEIGHT);
  for (const t of tokenize(article.summary)) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

/**
 * Tokens rare enough across the corpus to behave like named entities —
 * "Spangdahlem", "Benko", "Panettiere". Sharing one of these is much stronger
 * evidence of the same event than any amount of shared common vocabulary, which
 * is what rescues cross-language pairs whose wording otherwise barely overlaps.
 */
const RARE_DF_MAX = 4;
const RARE_MIN_LEN = 5;
/** Per shared rare entity, capped at two. Tuned with `npm run inspect:clusters`. */
const ENTITY_BONUS = 0.09;
/**
 * The entity bonus may only rescue a pair that already shares real vocabulary.
 * Without this floor it invents matches: two separate UN General Assembly
 * speeches share "un", "israel" and "gaza" and would otherwise be merged into a
 * single story that never existed.
 */
const MIN_BASE_FOR_BONUS = 0.18;

export interface VectorSet {
  vectors: Vector[];
  rare: Set<string>[];
}

/** L2-normalised TF-IDF vectors, so cosine similarity is a plain dot product. */
export function buildVectorSet(articles: Article[]): VectorSet {
  const tfs = articles.map(termFrequency);

  const docFreq = new Map<string, number>();
  for (const tf of tfs) {
    for (const term of tf.keys()) docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
  }

  const n = articles.length;
  const vectors: Vector[] = [];
  const rare: Set<string>[] = [];

  for (const tf of tfs) {
    const vec: Vector = new Map();
    const rareTokens = new Set<string>();
    let norm = 0;
    for (const [term, count] of tf) {
      const df = docFreq.get(term) ?? 1;
      // A term appearing in nearly every document carries no signal at all.
      if (df > n * 0.4) continue;
      const weight = (1 + Math.log(count)) * Math.log((n + 1) / (df + 0.5));
      vec.set(term, weight);
      norm += weight * weight;
      if (df <= RARE_DF_MAX && term.length >= RARE_MIN_LEN && !/^\d+$/.test(term)) {
        rareTokens.add(term);
      }
    }
    norm = Math.sqrt(norm) || 1;
    for (const [term, w] of vec) vec.set(term, w / norm);
    vectors.push(vec);
    rare.push(rareTokens);
  }

  return { vectors, rare };
}

function sharedCount(a: Set<string>, b: Set<string>): number {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let n = 0;
  for (const t of small) if (large.has(t)) n++;
  return n;
}

export function cosine(a: Vector, b: Vector): number {
  // Iterate the smaller map — most pairs share almost nothing.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let sum = 0;
  for (const [term, weight] of small) {
    const other = large.get(term);
    if (other !== undefined) sum += weight * other;
  }
  return sum;
}

interface Cluster {
  members: number[];
  centroid: Vector;
  rare: Set<string>;
  newest: number;
  oldest: number;
  /** Round-ups: never joined and never merged. */
  sealed?: boolean;
}

function addToCentroid(cluster: Cluster, vec: Vector): void {
  const k = cluster.members.length;
  const centroid = cluster.centroid;
  for (const [term, w] of vec) {
    centroid.set(term, ((centroid.get(term) ?? 0) * k + w) / (k + 1));
  }
  // Re-normalise so cosine against the centroid stays comparable to the threshold.
  let norm = 0;
  for (const w of centroid.values()) norm += w * w;
  norm = Math.sqrt(norm) || 1;
  if (Math.abs(norm - 1) > 1e-9) {
    for (const [term, w] of centroid) centroid.set(term, w / norm);
  }
}

/**
 * Greedy agglomerative clustering over a recency-ordered corpus, followed by one
 * merge pass. The merge pass matters: processing order alone can split a story
 * whose earliest and latest articles word things differently.
 */
export function clusterArticles(
  articles: Article[],
  threshold = SIMILARITY_THRESHOLD,
): Article[][] {
  if (articles.length === 0) return [];

  const order = articles
    .map((a, i) => ({ i, t: Date.parse(a.publishedAt) }))
    .sort((a, b) => b.t - a.t);

  const { vectors, rare } = buildVectorSet(articles);
  const clusters: Cluster[] = [];

  for (const { i, t } of order) {
    const vec = vectors[i];
    const rareTokens = rare[i];
    const article = articles[i];
    if (!vec || !rareTokens || !article) continue;

    let best: Cluster | null = null;
    let bestSim = threshold;

    // Round-ups stand alone rather than dragging unrelated events into a story.
    if (isDigest(article.title)) {
      clusters.push({
        members: [i],
        centroid: new Map(vec),
        rare: new Set(),
        newest: t,
        oldest: t,
        sealed: true,
      });
      continue;
    }

    for (const cluster of clusters) {
      if (cluster.sealed) continue;
      if (cluster.newest - t > WINDOW_MS || t - cluster.oldest > WINDOW_MS) continue;
      const base = cosine(vec, cluster.centroid);
      const bonus =
        base >= MIN_BASE_FOR_BONUS
          ? ENTITY_BONUS * Math.min(2, sharedCount(rareTokens, cluster.rare))
          : 0;
      const sim = base + bonus;
      if (sim > bestSim) {
        bestSim = sim;
        best = cluster;
      }
    }

    if (best) {
      addToCentroid(best, vec);
      best.members.push(i);
      for (const tok of rareTokens) best.rare.add(tok);
      best.oldest = Math.min(best.oldest, t);
      best.newest = Math.max(best.newest, t);
    } else {
      clusters.push({
        members: [i],
        centroid: new Map(vec),
        rare: new Set(rareTokens),
        newest: t,
        oldest: t,
      });
    }
  }

  // Merge pass — slightly stricter than the join threshold, since merging two
  // established clusters is a bigger claim than adding one article to one.
  const mergeThreshold = threshold + 0.06;
  for (let a = 0; a < clusters.length; a++) {
    const ca = clusters[a];
    if (!ca || ca.members.length === 0 || ca.sealed) continue;
    for (let b = a + 1; b < clusters.length; b++) {
      const cb = clusters[b];
      if (!cb || cb.members.length === 0 || cb.sealed) continue;
      if (ca.newest - cb.oldest > WINDOW_MS || cb.newest - ca.oldest > WINDOW_MS) continue;
      const base = cosine(ca.centroid, cb.centroid);
      const bonus =
        base >= MIN_BASE_FOR_BONUS
          ? ENTITY_BONUS * Math.min(2, sharedCount(ca.rare, cb.rare))
          : 0;
      if (base + bonus >= mergeThreshold) {
        for (const m of cb.members) {
          ca.members.push(m);
          const v = vectors[m];
          if (v) addToCentroid(ca, v);
          for (const tok of rare[m] ?? []) ca.rare.add(tok);
        }
        ca.oldest = Math.min(ca.oldest, cb.oldest);
        ca.newest = Math.max(ca.newest, cb.newest);
        cb.members = [];
      }
    }
  }

  return clusters
    .filter((c) => c.members.length > 0)
    .map((c) =>
      c.members
        .map((i) => articles[i])
        .filter((a): a is Article => a !== undefined)
        .sort((x, y) => Date.parse(y.publishedAt) - Date.parse(x.publishedAt)),
    );
}

/** Lower is better: tier 1 outlets supply the canonical headline for a story. */
function tierOf(sourceId: string): number {
  return getSource(sourceId)?.tier ?? 3;
}

function majorityCategory(articles: Article[]): Category {
  const counts = new Map<Category, number>();
  for (const a of articles) counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
  let best: Category = articles[0]?.category ?? 'world';
  let bestCount = 0;
  for (const [cat, n] of counts) {
    if (n > bestCount) {
      bestCount = n;
      best = cat;
    }
  }
  return best;
}

export function toStories(clusters: Article[][]): Story[] {
  return clusters.map((articles) => {
    // The lead article decides the headline: prefer a higher tier, break ties by recency.
    const lead = [...articles].sort((a, b) => {
      const t = tierOf(a.sourceId) - tierOf(b.sourceId);
      if (t !== 0) return t;
      return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    })[0]!;

    const sourceIds = [...new Set(articles.map((a) => a.sourceId))].sort(
      (a, b) => tierOf(a) - tierOf(b),
    );
    const countries = [
      ...new Set(articles.map((a) => getSource(a.sourceId)?.country).filter((c): c is string => !!c)),
    ];

    const withImage = articles.find((a) => a.image);
    const withSummary = articles.find((a) => a.summary.length > 40) ?? lead;
    const times = articles.map((a) => Date.parse(a.publishedAt));

    return {
      id: hashId(articles.map((a) => a.id).sort().join('|')),
      title: lead.title,
      summary: withSummary.summary,
      category: majorityCategory(articles),
      articles,
      sourceIds,
      countries,
      ...(withImage?.image ? { image: withImage.image } : {}),
      ...(withImage?.imageAlt ? { imageAlt: withImage.imageAlt } : {}),
      firstSeen: new Date(Math.min(...times)).toISOString(),
      lastSeen: new Date(Math.max(...times)).toISOString(),
      crossBorder:
        new Set(articles.map((a) => getSource(a.sourceId)?.region)).size > 1,
      score: 0,
    };
  });
}
