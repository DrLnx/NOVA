/** Shared text handling. Deliberately dependency-free and synchronous. */

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß',
  eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', ntilde: 'ñ',
  hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’',
  ldquo: '“', rdquo: '”', bdquo: '„', laquo: '«', raquo: '»',
  euro: '€', pound: '£', deg: '°', middot: '·', bull: '•', shy: '',
};

export function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      const code = Number.parseInt(body.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    if (body.startsWith('#')) {
      const code = Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return NAMED_ENTITIES[body] ?? whole;
  });
}

export function stripHtml(input: string): string {
  return decodeEntities(
    input
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, ' ')
      .replace(/<[^>]*>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

/** Publisher boilerplate that adds nothing once the article is a card. */
const BOILERPLATE: RegExp[] = [
  /\s*Continue reading\.\.\.\s*$/i,
  /\s*\[\s*mehr\s*\]\s*$/i,
  /\s*\[\s*more\s*\]\s*$/i,
  /\s*Read more\s*$/i,
  /\s*Weiterlesen\s*$/i,
  /\s*Mehr auf .+$/i,
  /\s*Der Beitrag .+ erschien zuerst auf .+$/i,
  /\s*This article (was )?(first )?appeared .+$/i,
];

export function cleanSummary(raw: string | undefined, maxLen = 220): string {
  if (!raw) return '';
  let text = stripHtml(raw);
  for (const rx of BOILERPLATE) text = text.replace(rx, '');
  text = text.replace(/\s+/g, ' ').trim();
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–—-]+$/, '')}…`;
}

/**
 * Fold German diacritics so search and clustering treat "Großbritannien" and
 * "Grossbritannien" as the same word.
 */
export function fold(input: string): string {
  return input
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC');
}

/** FNV-1a — short, stable, collision-safe enough for content ids. */
export function hashId(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let h2 = 0x9e3779b9;
  for (let i = input.length - 1; i >= 0; i--) {
    h2 ^= input.charCodeAt(i);
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return (h.toString(36) + h2.toString(36)).slice(0, 12);
}

/** Strip tracking parameters so the same article from two feeds dedupes. */
const TRACKING_PARAMS =
  /^(utm_|fbclid|gclid|mc_|ref|ref_src|CMP|cmp|at_|smid|__twitter|traffic_source|maca|feature|ns_)/;

export function canonicalUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) {
      if (TRACKING_PARAMS.test(key)) u.searchParams.delete(key);
    }
    u.protocol = 'https:';
    u.hostname = u.hostname.replace(/^www\./, '');
    if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, '');
    return u.toString();
  } catch {
    return raw.trim();
  }
}
