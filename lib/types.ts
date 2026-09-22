/** Core domain types for SCOPE. */

export const CATEGORIES = [
  'politics',
  'economy',
  'technology',
  'science',
  'society',
  'world',
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Where the *publisher* sits, not what the article is about. */
export type Region = 'de' | 'global';

export type Lang = 'de' | 'en';

/**
 * Editorial tier, used for ranking and for the canonical headline of a story.
 * 1 — public broadcasters, wire services and papers of record
 * 2 — established quality outlets and respected specialists
 * 3 — outlets with an explicit perspective or advocacy angle; surfaced with a label
 */
export type Tier = 1 | 2 | 3;

export interface FeedDef {
  url: string;
  /** Category applied to every item unless a more specific rule overrides it. */
  category: Category | 'mixed';
}

export interface Source {
  id: string;
  name: string;
  /** Short mono label shown on cards. */
  short: string;
  tier: Tier;
  region: Region;
  lang: Lang;
  homepage: string;
  /** Country of publication, ISO-ish display code. */
  country: string;
  feeds: FeedDef[];
  /** Transparency copy for /sources, in both UI languages. */
  about: { de: string; en: string };
  ownership: { de: string; en: string };
  funding: { de: string; en: string };
}

export interface Article {
  /** Stable hash of the canonical URL. */
  id: string;
  title: string;
  summary: string;
  url: string;
  sourceId: string;
  category: Category;
  region: Region;
  lang: Lang;
  /** ISO 8601 UTC. */
  publishedAt: string;
  image?: string;
  imageAlt?: string;
  author?: string;
}

export interface Story {
  id: string;
  /** Headline of the highest-tier, most recent member article. */
  title: string;
  summary: string;
  category: Category;
  articles: Article[];
  /** Distinct source ids, ordered by tier. */
  sourceIds: string[];
  /** Distinct countries covering the story. */
  countries: string[];
  image?: string;
  imageAlt?: string;
  firstSeen: string;
  lastSeen: string;
  /** True when both German and international outlets are covering it. */
  crossBorder: boolean;
  score: number;
}

export interface Corpus {
  articles: Article[];
  stories: Story[];
  byId: Map<string, Article>;
  storyById: Map<string, Story>;
  /** Feeds that failed this cycle — surfaced in the UI rather than hidden. */
  failures: { sourceId: string; url: string; reason: string }[];
  builtAt: string;
}
