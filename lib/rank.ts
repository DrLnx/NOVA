import type { Story } from './types';
import { getSource } from './sources';

/**
 * Importance weighting.
 *
 * The number shown to the reader is the same number used to order the feed —
 * there is no hidden ranking behind the badge. It is built from additive,
 * nameable factors precisely so a story page can show its own arithmetic, and
 * so "this is important" is a claim the reader can check rather than trust.
 */
export type Importance = 'lead' | 'major' | 'notable' | 'routine';

export interface WeightFactor {
  /** Key into the dictionary, so the breakdown renders in the reader's language. */
  key: 'sources' | 'countries' | 'crossBorder' | 'reference' | 'recency' | 'base';
  points: number;
  /** Short quantity, e.g. "5" sources or "3h". */
  detail?: string;
}

export interface Weight {
  value: number;
  level: Importance;
  factors: WeightFactor[];
}

/**
 * Calibrated so the top of the scale stays rare and the middle stays legible.
 *
 * A flat "+18 per source" saturated at 100 for any story with three outlets, so
 * the four biggest stories of the day all showed the same number and the badge
 * told the reader nothing. Source count is therefore logarithmic: going from one
 * outlet to two is the strongest signal available, and each further outlet adds
 * progressively less.
 */
/**
 * The maxima below sum to exactly 100, so the scale the reader is shown is a
 * real one: 100 means a story minutes old, carried by eight or more outlets
 * across six countries, on both sides of the German/international divide. On an
 * ordinary day the top story lands in the seventies, and that is the honest
 * answer rather than a number inflated to fill the bar.
 */
const BASE = 8;
/** 11 x log2(sources): 2 -> 11, 4 -> 22, 8 -> 32 (capped). */
const SOURCE_SCALE = 11;
const MAX_SOURCE_POINTS = 32;
const PER_COUNTRY = 6;
const MAX_COUNTRY_POINTS = 18;
const CROSS_BORDER = 12;
const TIER_POINTS: Record<number, number> = { 1: 8, 2: 4, 3: 0 };
const MAX_RECENCY = 22;
const RECENCY_HALF_LIFE_H = 12;

export function weighStory(story: Story, now = Date.now()): Weight {
  const factors: WeightFactor[] = [{ key: 'base', points: BASE }];

  const sourceCount = story.sourceIds.length;
  const sourcePoints = Math.min(
    Math.round(SOURCE_SCALE * Math.log2(Math.max(1, sourceCount))),
    MAX_SOURCE_POINTS,
  );
  if (sourcePoints > 0) {
    factors.push({ key: 'sources', points: sourcePoints, detail: String(sourceCount) });
  }

  const extraCountries = Math.max(0, story.countries.length - 1);
  const countryPoints = Math.min(extraCountries * PER_COUNTRY, MAX_COUNTRY_POINTS);
  if (countryPoints > 0) {
    factors.push({ key: 'countries', points: countryPoints, detail: String(story.countries.length) });
  }

  if (story.crossBorder) factors.push({ key: 'crossBorder', points: CROSS_BORDER });

  const bestTier = Math.min(...story.sourceIds.map((id) => getSource(id)?.tier ?? 3));
  const tierPoints = TIER_POINTS[bestTier] ?? 0;
  if (tierPoints > 0) factors.push({ key: 'reference', points: tierPoints });

  const ageHours = Math.max(0, (now - Date.parse(story.lastSeen)) / 3_600_000);
  const recencyPoints = Math.round(MAX_RECENCY * Math.pow(0.5, ageHours / RECENCY_HALF_LIFE_H));
  if (recencyPoints > 0) {
    factors.push({
      key: 'recency',
      points: recencyPoints,
      detail: ageHours < 1 ? '<1h' : `${Math.round(ageHours)}h`,
    });
  }

  const value = Math.min(100, factors.reduce((sum, f) => sum + f.points, 0));

  return { value, level: levelFor(value), factors };
}

export function levelFor(value: number): Importance {
  if (value >= 68) return 'lead';
  if (value >= 50) return 'major';
  if (value >= 32) return 'notable';
  return 'routine';
}

/** How many of the four bars the indicator fills. */
export const LEVEL_BARS: Record<Importance, number> = {
  lead: 4,
  major: 3,
  notable: 2,
  routine: 1,
};

export function rankStories(stories: Story[], now = Date.now()): Story[] {
  return stories
    .map((s) => ({ ...s, score: weighStory(s, now).value }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Equal weight: the fresher story leads.
      return Date.parse(b.lastSeen) - Date.parse(a.lastSeen);
    });
}
