/**
 * Image hosts actually observed in the registered feeds, confirmed by sampling
 * the live corpus rather than guessed from domain names — FAZ serves from
 * numbered hosts (media0.faz.net, media1.faz.net) and netzpolitik from a cdn
 * subdomain, neither of which matches the obvious spelling.
 *
 * This list must stay in step with `remotePatterns` in next.config.ts: an image
 * whose host is missing there makes next/image throw, so anything unrecognised
 * is filtered out here and the card falls back to its typographic panel.
 */
export const IMAGE_HOST_EXACT = [
  'images.tagesschau.de',
  'www.heise.de',
  'heise.cloudimg.io',
  'i.guim.co.uk',
  'media.guim.co.uk',
  'ichef.bbci.co.uk',
  'cdn.prod.www.spiegel.de',
  'img.zeit.de',
  'cdn.netzpolitik.org',
  'cdn.arstechnica.net',
  'media.npr.org',
  'npr.brightspotcdn.com',
  'static.dw.com',
  'static.euronews.com',
  'www.aljazeera.com',
  'media.nature.com',
  'www.sciencedaily.com',
] as const;

/** Suffix rules, for CDNs that number their hosts. */
export const IMAGE_HOST_SUFFIX = ['.faz.net'] as const;

const EXACT = new Set<string>(IMAGE_HOST_EXACT);

export function isRenderableImage(url: string | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    if (EXACT.has(u.hostname)) return true;
    return IMAGE_HOST_SUFFIX.some((suffix) => u.hostname.endsWith(suffix));
  } catch {
    return false;
  }
}
