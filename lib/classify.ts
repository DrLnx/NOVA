import type { Category } from './types';
import { fold } from './text';

/**
 * Sections that are not current-events education: sport, travel, lifestyle,
 * celebrity and local city desks. Dropping them at classification time keeps the
 * feed dense — FAZ's "aktuell" feed alone is roughly a third sport and lifestyle.
 */
const DROP_PATH = [
  '/sport', '/football', '/soccer', '/fussball', '/bundesliga', '/olympia',
  '/reise', '/travel', '/stil/', '/lifestyle', '/mode', '/fashion',
  '/essen-trinken', '/food', '/rezept', '/leute', '/celebrity', '/gossip',
  '/rhein-main', '/tv-kritik', '/quiz', '/horoskop', '/lotto',
  '/video/video-', '/multimedia/livestream', '/podcast', '/newsletter',
  '/games', '/gaming', '/tv-and-radio', '/film/', '/music/', '/books/',
];

export function shouldDrop(url: string, title: string): boolean {
  const u = url.toLowerCase();
  if (DROP_PATH.some((p) => u.includes(p))) return true;
  const t = fold(title);
  if (/^(liveblog|live-?ticker|newsblog)\b/.test(t)) return false; // liveblogs are real news
  if (/^(sportschau|sportstudio)\b/.test(t)) return true;
  return false;
}

/** URL path → category. Checked before keyword scoring because it is exact. */
const PATH_RULES: [RegExp, Category][] = [
  [/\/(wirtschaft|finanzen|boerse|business|economy|economics|money|markets)\b/, 'economy'],
  [/\/(digital|technik|technology|tech|netzwelt|netzpolitik|it|security)\b/, 'technology'],
  [/\/(wissen|wissenschaft|science|forschung|klima|umwelt|environment|health|gesundheit)\b/, 'science'],
  [/\/(ausland|international|world|europe|africa|asia|americas|middle-?east|us-news|uk-news)\b/, 'world'],
  [/\/(inland|politik|politics|innenpolitik)\b/, 'politics'],
  [/\/(gesellschaft|panorama|society|kultur|culture|feuilleton|bildung|education|karriere)\b/, 'society'],
];

/** Feed-declared <category> labels → our taxonomy. Guardian and FAZ ship these. */
const TAG_RULES: [RegExp, Category][] = [
  [/\b(business|economics|economy|finance|markets|banking|inflation|trade)\b/i, 'economy'],
  [/\b(technology|tech|internet|ai|artificial intelligence|cyber|software|computing)\b/i, 'technology'],
  [/\b(science|research|climate|environment|space|medicine|health|biology|physics)\b/i, 'science'],
  [/\b(world news|world|foreign policy|war|conflict|diplomacy|migration|refugees)\b/i, 'world'],
  [/\b(politics|election|government|parliament|policy)\b/i, 'politics'],
  [/\b(society|culture|education|arts|media|social)\b/i, 'society'],
];

/**
 * Weighted bilingual lexicon. Only reached for genuinely mixed feeds
 * (tagesschau/index, DW, FAZ aktuell, Spiegel Schlagzeilen, Zeit index), where
 * neither the URL path nor a feed-supplied tag settles the category.
 */
const LEXICON: Record<Category, string[]> = {
  politics: [
    'bundestag', 'bundesrat', 'bundeskanzler', 'kanzler', 'kanzlerin', 'koalition', 'kabinett',
    'wahl', 'wahlen', 'wahlkampf', 'landtag', 'landtagswahl', 'bundeswehr',
    'cdu', 'csu', 'spd', 'Grüne', 'afd', 'fdp', 'bsw', 'linke', 'unionsfraktion',
    'abgeordnete', 'gesetzentwurf', 'Bundespräsident', 'fraktion', 'koalitionsausschuss',
    'merz', 'scholz', 'klingbeil', 'weidel', 'habeck', 'bundeszwang', 'schwesig',
    'untersuchungsausschuss', 'volksabstimmung', 'Ministerpräsident', 'Bürgermeister',
    'parliament', 'election', 'coalition', 'chancellor', 'cabinet', 'senate', 'congress',
    'legislation', 'referendum', 'lawmakers', 'governor', 'primary',
  ],
  economy: [
    'wirtschaft', 'inflation', 'konjunktur', 'rezession', 'arbeitsmarkt', 'arbeitslos',
    'zinsen', 'leitzins', 'ezb', 'bundesbank', 'Börse', 'dax', 'aktie', 'aktien',
    'unternehmen', 'konzern', 'insolvenz', 'umsatz', 'gewinn', 'tarifstreit', 'tarif',
    'lohn', 'gehalt', 'steuer', 'haushalt', 'schulden', 'handel', 'zoll', 'Zölle',
    'export', 'import', 'preise', 'energie', 'Gasnotstand', 'Gasversorgung', 'gaspreis',
    'strompreis', 'autobauer', 'pkw', 'e-auto',
    'elektroauto', 'freihandelsabkommen', 'industrie', 'streik', 'mindestlohn', 'rente',
    'economy', 'inflation', 'recession', 'interest rate', 'central bank', 'stocks',
    'shares', 'earnings', 'revenue', 'tariff', 'tariffs', 'trade', 'unemployment',
    'wages', 'budget', 'deficit', 'ipo', 'merger', 'bankruptcy', 'layoffs',
  ],
  technology: [
    'software', 'hardware', 'internet', 'digital', 'digitalisierung', 'künstliche Intelligenz',
    'ki', 'ai', 'chatbot', 'algorithmus', 'datenschutz', 'cyberangriff', 'hacker',
    'Sicherheitslücke', 'Verschlüsselung', 'chip', 'chips', 'halbleiter', 'smartphone',
    'browser', 'betriebssystem', 'plattform', 'app', 'apps', 'roboter', 'drohne',
    'social media', 'tiktok', 'google', 'apple', 'microsoft', 'meta', 'amazon',
    'artificial intelligence', 'machine learning', 'chatgpt', 'openai', 'anthropic',
    'nvidia', 'cybersecurity', 'data breach', 'encryption', 'semiconductor', 'startup',
    'malware', 'ransomware', 'quantum',
  ],
  science: [
    'forschung', 'forscher', 'forscherin', 'studie', 'wissenschaft', 'wissenschaftler',
    'klima', 'klimawandel', 'klimaforscher', 'Erderwärmung', 'artensterben', 'biologie',
    'physik', 'chemie', 'astronomie', 'weltraum', 'rakete', 'satellit', 'impfstoff',
    'virus', 'medizin', 'gesundheit', 'krankheit', 'therapie', 'genetik', 'evolution',
    'Archäologie', 'umwelt', 'emissionen', 'artenschutz', 'gletscher',
    'research', 'study', 'scientists', 'climate', 'emissions', 'species', 'vaccine',
    'telescope', 'spacecraft', 'nasa', 'genome', 'clinical trial', 'physics', 'quantum',
    'biodiversity', 'fossil', 'antibiotic',
  ],
  society: [
    'gesellschaft', 'bildung', 'schule', 'schulen', 'Universität', 'studierende', 'studenten',
    'migration', 'integration', 'pflege', 'wohnen', 'miete', 'mieten', 'kirche', 'kultur',
    'museum', 'justiz', 'gericht', 'urteil', 'prozess', 'staatsanwaltschaft', 'polizei',
    'Kriminalität', 'demonstration', 'protest', 'diskriminierung', 'obdachlos', 'armut',
    'kinder', 'jugendliche', 'familie', 'Ehrenbürger',
    'education', 'school', 'university', 'housing', 'rent', 'court', 'trial', 'verdict',
    'police', 'inequality', 'welfare', 'immigration', 'homeless', 'poverty', 'charity',
  ],
  world: [
    'ukraine', 'russland', 'putin', 'selenskyj', 'nato', 'krieg', 'waffenruhe', 'israel',
    'gaza', 'hamas', 'iran', 'china', 'usa', 'trump', 'vereinte nationen', 'un-vollversammlung',
    'generalversammlung', 'sanktionen', 'diplomatie', 'botschafter', 'flucht', 'Geflüchtete',
    'taifun', 'erdbeben', 'westjordanland', 'syrien', 'jemen', 'afghanistan', 'nordkorea',
    'Türkei', 'frankreich', 'grossbritannien', 'polen', 'Brüssel', 'eu-gipfel',
    'israelisch', 'russisch', 'chinesisch', 'amerikanisch', 'ukrainisch', 'iranisch',
    'türkisch', 'französisch', 'britisch', 'polnisch', 'syrisch', 'palästinensisch',
    'ausland', 'weltweit', 'international',
    'ukraine', 'russia', 'nato', 'war', 'ceasefire', 'israel', 'gaza', 'iran', 'china',
    'united nations', 'sanctions', 'diplomacy', 'summit', 'invasion', 'airstrike',
    'refugees', 'genocide', 'occupied', 'militants', 'earthquake', 'typhoon',
  ],
};

/**
 * One word-boundary regex per category, built once. Folded text is ASCII, so \b
 * behaves — which matters for short tokens like "spd" or "ki" that appear as
 * "(SPD)" or "die KI regulieren" and would be missed by space-padded matching.
 */
const MATCHERS = (Object.entries(LEXICON) as [Category, string[]][]).map(([cat, words]) => {
  const parts = words
    .map(fold)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/-/g, '[- ]?'))
    .sort((a, b) => b.length - a.length)
    // German builds compounds and inflects adjectives, so "energie" has to match
    // "Energiekrise" and "israel" has to match "israelischer". Terms of five
    // characters or more therefore match as a prefix; shorter ones (ki, ai, spd,
    // eu) stay exact, where a prefix rule would fire on unrelated words.
    .map((w) => (w.replace(/\\/g, '').length >= 5 ? `${w}\\w*` : `${w}\\b`));
  return { cat, rx: new RegExp(`\\b(?:${parts.join('|')})`, 'g') };
});

export function classify(opts: {
  feedCategory: Category | 'mixed';
  url: string;
  title: string;
  summary: string;
  tags: string[];
  region: 'de' | 'global';
}): Category {
  if (opts.feedCategory !== 'mixed') return opts.feedCategory;

  const path = fold(opts.url);
  for (const [rx, cat] of PATH_RULES) {
    if (rx.test(path)) return cat;
  }

  for (const tag of opts.tags) {
    for (const [rx, cat] of TAG_RULES) {
      if (rx.test(tag)) return cat;
    }
  }

  // The title carries far more signal than the summary, so it is weighted 3:1.
  const title = fold(opts.title);
  const summary = fold(opts.summary);

  let best: Category | null = null;
  let bestScore = 0;
  for (const { cat, rx } of MATCHERS) {
    rx.lastIndex = 0;
    const titleHits = (title.match(rx) ?? []).length;
    rx.lastIndex = 0;
    const summaryHits = (summary.match(rx) ?? []).length;
    const score = titleHits * 3 + summaryHits;
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }
  if (best && bestScore >= 2) return best;
  if (best && bestScore === 1) return best;

  return opts.region === 'global' ? 'world' : 'politics';
}

/**
 * Round-ups, liveblog indexes and interactive data pages each cover several
 * unrelated events at once, so letting them into a cluster drags in whatever
 * else they happen to mention. They stay in the feed as their own items but are
 * never merged with anything.
 */
const DIGEST_PATTERNS: RegExp[] = [
  /^(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\s*:/i,
  /news[-\s]?kompakt/i,
  /wochenr(ue|ü)ckblick|r(ue|ü)ckblick der woche/i,
  /^was (heute|am|diese woche)/i,
  /^(die )?nachrichten(\s|$)/i,
  /^(top[-\s])?(themen|schlagzeilen)\b/i,
  /^(morning|daily|evening)\s+(brief|briefing)/i,
  /\.\s+and,\s/i,
  /bilder des tages|fotos des tages|photos of the (day|week)/i,
  /koalitionsrechner|wahlkarte|karte mit den ergebnissen/i,
  /^(kurz )?(gemeldet|notiert)\b/i,
  /in pictures|in charts|the week in/i,
];

export function isDigest(title: string): boolean {
  return DIGEST_PATTERNS.some((rx) => rx.test(title));
}
