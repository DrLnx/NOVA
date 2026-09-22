import type { Article, FeedDef, Source } from './types';
import type { RawItem } from './parse';
import { canonicalUrl, cleanSummary, decodeEntities, fold, hashId, stripHtml } from './text';
import { classify, shouldDrop } from './classify';

/** Feeds carry RFC-822, ISO-8601 and bare dates (Nature). Accept all three. */
function parseDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const t = Date.parse(raw.trim());
  if (Number.isFinite(t)) return new Date(t).toISOString();
  const m = /(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00Z`).toISOString();
  return null;
}

/** First <img> inside content:encoded — how tagesschau, heise, FAZ and NPR ship images. */
function imageFromContent(html: string | undefined): { url: string; alt?: string } | null {
  if (!html) return null;
  const tag = /<img\b[^>]*>/i.exec(html);
  if (!tag) return null;
  const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag[0]);
  if (!src?.[1]) return null;
  const alt = /\balt\s*=\s*["']([^"']*)["']/i.exec(tag[0]);
  return { url: decodeEntities(src[1]), alt: alt?.[1] ? decodeEntities(alt[1]) : undefined };
}

/**
 * Feed image URLs are used exactly as published, never rewritten.
 *
 * The Guardian signs its image URLs with an `s=` hash computed over the query
 * string, so "upgrading" width or quality invalidates the signature and the CDN
 * answers 401. Publishers that offer several sizes list them all as separate
 * signed URLs, so picking the widest candidate is both simpler and correct.
 */

function pickImage(item: RawItem): { url: string; alt?: string } | null {
  const usable = item.media
    .filter((m) => !m.type || m.type.startsWith('image/'))
    .filter((m) => /^https?:\/\//i.test(m.url))
    // Spacer gifs and tracking pixels turn up in a few feeds.
    .filter((m) => !/\b(1x1|pixel|spacer|blank)\b/i.test(m.url));

  if (usable.length) {
    const widest = usable.reduce((a, b) => ((b.width ?? 0) > (a.width ?? 0) ? b : a));
    return { url: widest.url };
  }

  const fromContent = imageFromContent(item.content);
  if (fromContent && /^https?:\/\//i.test(fromContent.url)) {
    return fromContent;
  }
  return null;
}

/**
 * Nature's content:encoded is only a DOI line plus a repeat of the headline, and
 * several feeds echo the title as the description. Neither is a summary, so we
 * return an empty string and let the card render title-only rather than padding
 * it with text that tells the reader nothing.
 */
function summaryFor(item: RawItem, title: string): string {
  const candidate = item.description && item.description.length > 20 ? item.description : item.content;
  let summary = cleanSummary(candidate);

  summary = summary
    .replace(/^Nature,?\s*(Published online|Volume|Issue)[^;]*;\s*(doi:\S+)?\s*/i, '')
    .replace(/^doi:\S+\s*/i, '')
    .trim();

  const f = fold(summary);
  const ft = fold(title);
  if (!f || f === ft || (f.length < ft.length + 12 && ft.includes(f.slice(0, 40)))) return '';
  return summary;
}

const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_FUTURE_MS = 36 * 60 * 60 * 1000;

export function normalize(item: RawItem, source: Source, feed: FeedDef, now = Date.now()): Article | null {
  const title = stripHtml(item.title);
  if (!title || title.length < 8) return null;

  const url = canonicalUrl(item.link);
  if (!/^https?:\/\//i.test(url)) return null;
  if (shouldDrop(url, title)) return null;

  const publishedAt = parseDate(item.pubDate);
  if (!publishedAt) return null;
  const ts = Date.parse(publishedAt);
  if (now - ts > MAX_AGE_MS) return null;
  if (ts - now > MAX_FUTURE_MS) return null;

  const summary = summaryFor(item, title);
  const image = pickImage(item);

  const category = classify({
    feedCategory: feed.category,
    url,
    title,
    summary,
    tags: item.categories,
    region: source.region,
  });

  return {
    id: hashId(url),
    title,
    summary,
    url,
    sourceId: source.id,
    category,
    region: source.region,
    lang: source.lang,
    publishedAt,
    ...(image ? { image: image.url } : {}),
    ...(image?.alt ? { imageAlt: image.alt } : {}),
    ...(item.author ? { author: stripHtml(item.author).slice(0, 80) } : {}),
  };
}
