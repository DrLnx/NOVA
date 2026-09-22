import type { Category, Lang, Localized, LocalizedText } from './types';

export const LANGS = ['de', 'en'] as const;
export const DEFAULT_LANG: Lang = 'de';

/**
 * Every user-facing string. Article headlines are never translated — they are
 * shown exactly as the publisher wrote them, in their own language.
 */
export const DICT = {
  de: {
    tagline: 'Nachrichten-Intelligenz',
    subtitle: 'Deutsche und internationale Nachrichten, nach Ereignis gebündelt.',

    nav: { home: 'Start', briefing: 'Briefing', search: 'Suche', sources: 'Quellen', saved: 'Gespeichert' },

    categories: {
      politics: 'Politik', economy: 'Wirtschaft', technology: 'Technologie',
      science: 'Wissenschaft', society: 'Gesellschaft', world: 'Welt',
    } satisfies Record<Category, string>,

    regions: { all: 'Alle', de: 'Deutschland', global: 'International' },

    topStories: 'Top-Meldungen',
    latest: 'Neueste',
    moreStories: 'Weitere Meldungen',
    allCoverage: 'Gesamte Berichterstattung',
    coverage: 'Berichterstattung',
    sourcesCovering: (n: number) => (n === 1 ? '1 Quelle' : `${n} Quellen`),
    articlesCount: (n: number) => (n === 1 ? '1 Artikel' : `${n} Artikel`),
    countriesCount: (n: number) => (n === 1 ? '1 Land' : `${n} Länder`),
    crossBorder: 'Deutsch & international',
    readAt: (name: string) => `Bei ${name} lesen`,
    readOriginal: 'Originalartikel lesen',
    openOriginal: 'Original öffnen',
    relatedCoverage: 'Andere Quellen zu diesem Thema',
    moreFrom: (name: string) => `Mehr von ${name}`,
    backToFeed: 'Zurück zur Übersicht',

    weight: 'Gewichtung',
    weightExplain: 'Wie sich die Gewichtung zusammensetzt',
    weightNote:
      'Diese Zahl bestimmt auch die Reihenfolge im Feed — es gibt keine verborgene Rangfolge dahinter. Je mehr unabhängige Redaktionen aus je mehr Ländern eine Meldung aufgreifen, desto höher das Gewicht.',
    importance: {
      lead: 'Leitmeldung',
      major: 'Wichtig',
      notable: 'Beachtenswert',
      routine: 'Randnotiz',
    } as Record<string, string>,
    weightFactors: {
      base: 'Grundwert',
      sources: 'Unabhängige Quellen',
      countries: 'Länder',
      crossBorder: 'Deutsch & international',
      reference: 'Referenzquelle beteiligt',
      recency: 'Aktualität',
    } as Record<string, string>,
    leadStories: 'Leitmeldungen',
    byWeight: 'Nach Gewichtung',
    furtherStories: 'Weitere Meldungen',
    sortedByWeight: 'Nach Gewichtung sortiert',

    whyItMatters: 'Warum das relevant ist',
    aiBriefing: 'KI-Einordnung',
    aiNotice: (model: string) =>
      `Automatisch erzeugt von ${model} auf Basis der oben stehenden Überschriften und Anrisse. Keine eigenständige Recherche — im Zweifel den Originalartikeln folgen.`,
    coverageSpread: 'Verbreitung der Berichterstattung',
    coverageSpreadBody: (sources: number, countries: number) =>
      `${sources} unabhängige Redaktionen aus ${countries} ${countries === 1 ? 'Land' : 'Ländern'} halten dieses Ereignis für berichtenswert.`,
    framingNote:
      'Dieselbe Meldung, unterschiedlich formuliert. Die Unterschiede in Überschrift und Anriss zeigen, worauf jede Redaktion den Schwerpunkt legt.',
    background: 'Hintergrund',
    backgroundNote: 'Kurze, neutrale Erklärungen zu Begriffen, die in dieser Meldung vorkommen.',

    searchTitle: 'Suche',
    searchPlaceholder: 'Nachrichten durchsuchen…',
    searchHint: 'Suchbegriff eingeben',
    resultsCount: (n: number) => (n === 1 ? '1 Ergebnis' : `${n} Ergebnisse`),
    noResults: 'Keine Treffer',
    noResultsHint: 'Andere Begriffe oder Filter versuchen.',
    filters: 'Filter',
    clearFilters: 'Filter zurücksetzen',
    allCategories: 'Alle Ressorts',
    allSources: 'Alle Quellen',
    timeframe: 'Zeitraum',
    anyTime: 'Beliebig',
    last24h: 'Letzte 24 Stunden',
    last3d: 'Letzte 3 Tage',
    last7d: 'Letzte 7 Tage',

    briefingTitle: 'Das Briefing',
    briefingIntro: 'Die wichtigsten Meldungen des Tages, in fünf Minuten.',
    briefingEmpty: 'Derzeit keine Meldungen verfügbar.',

    savedTitle: 'Gespeichert',
    savedIntro: 'Artikel, die du zum späteren Lesen markiert hast. Sie liegen nur in diesem Browser.',
    savedEmpty: 'Noch nichts gespeichert.',
    savedEmptyHint: 'Über das Lesezeichen-Symbol an jedem Artikel speichern.',
    save: 'Speichern',
    unsave: 'Entfernen',

    sourcesTitle: 'Quellen',
    sourcesIntro:
      'SCOPE bezieht Meldungen ausschließlich aus diesen Redaktionen. Wer eine Nachricht finanziert und wem sie gehört, gehört zur Nachricht dazu — deshalb steht es hier.',
    ownership: 'Eigentümer',
    funding: 'Finanzierung',
    perspectiveWarning:
      'Vertritt eine erklärte Position. Nützlich, aber nicht als neutrale Quelle zu lesen.',
    tierLabel: { 1: 'Referenzquelle', 2: 'Etabliert', 3: 'Mit Standpunkt' } as Record<number, string>,
    feedCount: (n: number) => `${n} ${n === 1 ? 'Feed' : 'Feeds'}`,

    commandPalette: 'Befehle',
    commandHint: 'Suchen oder springen…',
    commandNav: 'Navigation',
    commandCategories: 'Ressorts',
    commandResults: 'Artikel',
    commandEmpty: 'Nichts gefunden.',
    open: 'Öffnen',
    close: 'Schließen',
    navigate: 'Navigieren',

    theme: 'Erscheinungsbild',
    language: 'Sprache',
    justNow: 'gerade eben',
    minutesAgo: (n: number) => `vor ${n} Min.`,
    hoursAgo: (n: number) => `vor ${n} Std.`,
    daysAgo: (n: number) => (n === 1 ? 'gestern' : `vor ${n} Tagen`),

    updated: 'Live',
    articlesWord: 'Artikel',
    sourcesWord: 'Quellen',
    translated: 'Übersetzt',
    translatedNote: 'Maschinell übersetzt. Die Originalüberschrift steht auf der Meldungsseite.',
    originalLanguage: 'Nur auf Englisch verfügbar',
    inGerman: 'Deutsch',
    inEnglish: 'Englisch',
    originalHeadline: 'Originalüberschrift',
    sourcesUnavailable: (n: number) =>
      `${n} ${n === 1 ? 'Quelle ist' : 'Quellen sind'} derzeit nicht erreichbar.`,
    noArticles: 'Keine Artikel in diesem Ressort.',
    noArticlesHint: 'Später erneut versuchen — die Feeds werden alle fünf Minuten aktualisiert.',
    notFound: 'Nicht gefunden',
    notFoundBody:
      'Diese Meldung ist nicht mehr im aktuellen Zeitfenster. SCOPE hält die letzten 14 Tage vor.',
    errorTitle: 'Etwas ist schiefgelaufen',
    errorBody: 'Die Nachrichten konnten nicht geladen werden.',
    retry: 'Erneut versuchen',

    excerptNotice:
      'SCOPE zeigt Überschrift und Anriss und verlinkt auf das Original. Vollständige Artikel werden nicht gespeichert.',
    footerNote: 'Kein Tracking. Keine Konten. Feeds werden alle fünf Minuten aktualisiert.',
  },

  en: {
    tagline: 'News Intelligence',
    subtitle: 'German and global news, grouped by the event itself.',

    nav: { home: 'Home', briefing: 'Briefing', search: 'Search', sources: 'Sources', saved: 'Saved' },

    categories: {
      politics: 'Politics', economy: 'Economy', technology: 'Technology',
      science: 'Science', society: 'Society', world: 'World',
    } satisfies Record<Category, string>,

    regions: { all: 'All', de: 'Germany', global: 'International' },

    topStories: 'Top Stories',
    latest: 'Latest',
    moreStories: 'More stories',
    allCoverage: 'All coverage',
    coverage: 'Coverage',
    sourcesCovering: (n: number) => (n === 1 ? '1 source' : `${n} sources`),
    articlesCount: (n: number) => (n === 1 ? '1 article' : `${n} articles`),
    countriesCount: (n: number) => (n === 1 ? '1 country' : `${n} countries`),
    crossBorder: 'German & international',
    readAt: (name: string) => `Read at ${name}`,
    readOriginal: 'Read the original',
    openOriginal: 'Open original',
    relatedCoverage: 'Other sources on this story',
    moreFrom: (name: string) => `More from ${name}`,
    backToFeed: 'Back to the feed',

    weight: 'Weight',
    weightExplain: 'How this weight is made up',
    weightNote:
      'This number also sets the order of the feed — there is no hidden ranking behind it. The more independent newsrooms, across more countries, that pick a story up, the heavier it gets.',
    importance: {
      lead: 'Lead story',
      major: 'Major',
      notable: 'Notable',
      routine: 'Minor',
    } as Record<string, string>,
    weightFactors: {
      base: 'Base',
      sources: 'Independent sources',
      countries: 'Countries',
      crossBorder: 'German & international',
      reference: 'Reference source involved',
      recency: 'Recency',
    } as Record<string, string>,
    leadStories: 'Lead stories',
    byWeight: 'By weight',
    furtherStories: 'More stories',
    sortedByWeight: 'Sorted by weight',

    whyItMatters: 'Why this matters',
    aiBriefing: 'AI briefing',
    aiNotice: (model: string) =>
      `Generated by ${model} from the headlines and summaries above. It does no research of its own — where it matters, follow the original articles.`,
    coverageSpread: 'Spread of coverage',
    coverageSpreadBody: (sources: number, countries: number) =>
      `${sources} independent newsrooms across ${countries} ${countries === 1 ? 'country' : 'countries'} judged this worth covering.`,
    framingNote:
      'The same event, worded differently. What each newsroom puts in the headline and the opening line is what it decided mattered most.',
    background: 'Background',
    backgroundNote: 'Short, neutral explanations of terms that appear in this story.',

    searchTitle: 'Search',
    searchPlaceholder: 'Search the news…',
    searchHint: 'Type to search',
    resultsCount: (n: number) => (n === 1 ? '1 result' : `${n} results`),
    noResults: 'No results',
    noResultsHint: 'Try different terms or clear the filters.',
    filters: 'Filters',
    clearFilters: 'Clear filters',
    allCategories: 'All categories',
    allSources: 'All sources',
    timeframe: 'Timeframe',
    anyTime: 'Any time',
    last24h: 'Last 24 hours',
    last3d: 'Last 3 days',
    last7d: 'Last 7 days',

    briefingTitle: 'The Briefing',
    briefingIntro: 'The stories that mattered today, in five minutes.',
    briefingEmpty: 'No stories available right now.',

    savedTitle: 'Saved',
    savedIntro: 'Articles you marked to read later. They live only in this browser.',
    savedEmpty: 'Nothing saved yet.',
    savedEmptyHint: 'Use the bookmark control on any article.',
    save: 'Save',
    unsave: 'Remove',

    sourcesTitle: 'Sources',
    sourcesIntro:
      'SCOPE pulls from these newsrooms and no others. Who funds a newsroom and who owns it is part of the news it produces, so it is listed here.',
    ownership: 'Ownership',
    funding: 'Funding',
    perspectiveWarning:
      'Takes an explicit position. Valuable, but not to be read as a neutral source.',
    tierLabel: { 1: 'Reference', 2: 'Established', 3: 'Has a viewpoint' } as Record<number, string>,
    feedCount: (n: number) => `${n} ${n === 1 ? 'feed' : 'feeds'}`,

    commandPalette: 'Commands',
    commandHint: 'Search or jump to…',
    commandNav: 'Navigation',
    commandCategories: 'Categories',
    commandResults: 'Articles',
    commandEmpty: 'Nothing found.',
    open: 'Open',
    close: 'Close',
    navigate: 'Navigate',

    theme: 'Appearance',
    language: 'Language',
    justNow: 'just now',
    minutesAgo: (n: number) => `${n}m ago`,
    hoursAgo: (n: number) => `${n}h ago`,
    daysAgo: (n: number) => (n === 1 ? 'yesterday' : `${n}d ago`),

    updated: 'Live',
    articlesWord: 'articles',
    sourcesWord: 'sources',
    translated: 'Translated',
    translatedNote: 'Machine-translated. The original headline is on the story page.',
    originalLanguage: 'Available in German only',
    inGerman: 'German',
    inEnglish: 'English',
    originalHeadline: 'Original headline',
    sourcesUnavailable: (n: number) =>
      `${n} ${n === 1 ? 'source is' : 'sources are'} unreachable right now.`,
    noArticles: 'No articles in this category.',
    noArticlesHint: 'Check back shortly — feeds refresh every five minutes.',
    notFound: 'Not found',
    notFoundBody:
      'This story has dropped out of the current window. SCOPE keeps the last 14 days.',
    errorTitle: 'Something went wrong',
    errorBody: 'The news could not be loaded.',
    retry: 'Try again',

    excerptNotice:
      'SCOPE shows a headline and a short summary, and links to the original. Full article text is never stored.',
    footerNote: 'No tracking. No accounts. Feeds refresh every five minutes.',
  },
} as const;

export type Dict = (typeof DICT)['de'];

export function getDict(lang: Lang): Dict {
  return DICT[lang] as Dict;
}

/** Relative time, in the reader's chosen language. */
export function relativeTime(iso: string, dict: Dict, now = Date.now()): string {
  const diff = Math.max(0, now - Date.parse(iso));
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return dict.justNow;
  if (minutes < 60) return dict.minutesAgo(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return dict.hoursAgo(hours);
  return dict.daysAgo(Math.floor(hours / 24));
}

export function absoluteTime(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'de' ? 'de-DE' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

/**
 * Reads a story or article in the requested language. Client-safe: it only
 * looks at data already resolved on the server, and falls back to the original
 * text for anything that was never localized.
 */
export function textFor(
  item: { title: string; summary: string; sourceId?: string; lang?: Lang; l10n?: Localized },
  lang: Lang,
): LocalizedText {
  return (
    item.l10n?.[lang] ?? {
      title: item.title,
      summary: item.summary,
      sourceId: item.sourceId ?? '',
      lang: item.lang ?? 'en',
      translated: false,
    }
  );
}
