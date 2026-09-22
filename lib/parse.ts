import { XMLParser } from 'fast-xml-parser';

/** One item as it comes off the wire, before normalisation. */
export interface RawItem {
  title: string;
  link: string;
  description?: string;
  content?: string;
  pubDate?: string;
  guid?: string;
  author?: string;
  categories: string[];
  /** Candidate images, widest first once collected. */
  media: { url: string; width?: number; type?: string }[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  textNodeName: '#text',
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  processEntities: true,
  htmlEntities: true,
  // Tags that may legitimately appear once but must still be arrays.
  isArray: (name) =>
    ['item', 'entry', 'category', 'link', 'media:content', 'media:thumbnail', 'enclosure'].includes(
      name,
    ),
});

/** fast-xml-parser hands back strings, objects with #text, or arrays. Flatten all three. */
function text(node: unknown): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number' || typeof node === 'boolean') return String(node);
  if (Array.isArray(node)) return text(node[0]);
  if (typeof node === 'object') {
    const rec = node as Record<string, unknown>;
    if ('#text' in rec) return text(rec['#text']);
    if ('@href' in rec) return text(rec['@href']);
  }
  return '';
}

function asArray<T>(node: T | T[] | undefined): T[] {
  if (node == null) return [];
  return Array.isArray(node) ? node : [node];
}

function pickInt(v: unknown): number | undefined {
  const n = Number.parseInt(text(v), 10);
  return Number.isFinite(n) ? n : undefined;
}

/** Atom entries carry several <link>s; the article is rel="alternate" (or the bare one). */
function atomLink(entry: Record<string, unknown>): string {
  const links = asArray(entry['link'] as unknown[]);
  const objs = links.filter((l): l is Record<string, unknown> => typeof l === 'object' && l !== null);
  const alternate = objs.find((l) => !l['@rel'] || l['@rel'] === 'alternate');
  if (alternate?.['@href']) return String(alternate['@href']);
  const first = objs[0];
  if (first?.['@href']) return String(first['@href']);
  return text(links[0]);
}

function collectMedia(node: Record<string, unknown>): RawItem['media'] {
  const out: RawItem['media'] = [];

  for (const key of ['media:content', 'media:thumbnail']) {
    for (const m of asArray(node[key] as unknown[])) {
      if (typeof m !== 'object' || m === null) continue;
      const rec = m as Record<string, unknown>;
      const url = text(rec['@url']);
      if (url) out.push({ url, width: pickInt(rec['@width']), type: text(rec['@type']) || undefined });
    }
  }

  // media:group wraps the same tags one level deeper.
  const group = node['media:group'];
  if (group && typeof group === 'object') {
    out.push(...collectMedia(group as Record<string, unknown>));
  }

  for (const e of asArray(node['enclosure'] as unknown[])) {
    if (typeof e !== 'object' || e === null) continue;
    const rec = e as Record<string, unknown>;
    const url = text(rec['@url']);
    const type = text(rec['@type']);
    if (url && (!type || type.startsWith('image/'))) {
      out.push({ url, width: pickInt(rec['@width']), type: type || undefined });
    }
  }

  // itunes/og style single image element
  const image = node['image'];
  if (image && typeof image === 'object') {
    const url = text((image as Record<string, unknown>)['url']);
    if (url) out.push({ url });
  }

  return out;
}

function categoriesOf(node: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const c of asArray(node['category'] as unknown[])) {
    const label = typeof c === 'object' && c !== null
      ? text((c as Record<string, unknown>)['#text']) || text((c as Record<string, unknown>)['@term'])
      : text(c);
    if (label) out.push(label);
  }
  for (const c of asArray(node['dc:subject'] as unknown[])) {
    const label = text(c);
    if (label) out.push(label);
  }
  return out;
}

function toRawItem(node: Record<string, unknown>, kind: 'rss' | 'atom'): RawItem | null {
  const title = text(node['title']);
  const link = kind === 'atom' ? atomLink(node) : text(node['link']) || text(node['guid']);
  if (!title || !link) return null;

  const content =
    text(node['content:encoded']) || text(node['content']) || text(node['description']) || '';
  const description =
    text(node['description']) || text(node['summary']) || text(node['media:description']) || '';

  return {
    title,
    link,
    description,
    content,
    pubDate:
      text(node['pubDate']) ||
      text(node['published']) ||
      text(node['updated']) ||
      text(node['dc:date']) ||
      undefined,
    guid: text(node['guid']) || text(node['id']) || undefined,
    author:
      text(node['dc:creator']) ||
      text((node['author'] as Record<string, unknown>)?.['name']) ||
      text(node['author']) ||
      undefined,
    categories: categoriesOf(node),
    media: collectMedia(node),
  };
}

/**
 * Parse an RSS 2.0, Atom or RDF document. DW serves RDF, where items sit at the
 * document root rather than inside <channel>, so all three shapes are handled here.
 */
export function parseFeed(xml: string): RawItem[] {
  const doc = parser.parse(xml) as Record<string, unknown>;

  const rss = doc['rss'] as Record<string, unknown> | undefined;
  if (rss?.['channel']) {
    const channel = asArray(rss['channel'] as unknown[])[0] as Record<string, unknown>;
    return asArray(channel?.['item'] as unknown[])
      .map((i) => toRawItem(i as Record<string, unknown>, 'rss'))
      .filter((i): i is RawItem => i !== null);
  }

  const feed = doc['feed'] as Record<string, unknown> | undefined;
  if (feed?.['entry']) {
    return asArray(feed['entry'] as unknown[])
      .map((i) => toRawItem(i as Record<string, unknown>, 'atom'))
      .filter((i): i is RawItem => i !== null);
  }

  const rdf = (doc['rdf:RDF'] ?? doc['RDF']) as Record<string, unknown> | undefined;
  if (rdf?.['item']) {
    return asArray(rdf['item'] as unknown[])
      .map((i) => toRawItem(i as Record<string, unknown>, 'rss'))
      .filter((i): i is RawItem => i !== null);
  }

  return [];
}
