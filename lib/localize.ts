import type { Article, Lang, Localized, LocalizedText, Story } from './types';
import { LANGS } from './i18n';
import { getSource } from './sources';
import { translate } from './translate';

/**
 * Resolving a story into the reader's language, in order of preference:
 *
 *   1. An article from the cluster already written in that language. About 60%
 *      of front-page stories have one, and a German newsroom's own headline
 *      beats any machine translation of an English one.
 *   2. Machine translation of the lead article, cached permanently on disk.
 *   3. The original text, labelled with its language.
 *
 * Nothing is ever silently presented as if it were written in the reader's
 * language when it was not.
 */

/** Best article in a given language: highest tier first, then most recent. */
function pickNative(articles: Article[], lang: Lang): Article | undefined {
  return articles
    .filter((a) => a.lang === lang && a.title.length > 0)
    .sort((a, b) => {
      const tier = (getSource(a.sourceId)?.tier ?? 3) - (getSource(b.sourceId)?.tier ?? 3);
      if (tier !== 0) return tier;
      return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    })[0];
}

async function translateInto(
  source: { title: string; summary: string; sourceId: string; lang: Lang },
  target: Lang,
): Promise<LocalizedText> {
  const [title, summary] = await Promise.all([
    translate(source.title, source.lang, target),
    source.summary ? translate(source.summary, source.lang, target) : Promise.resolve(null),
  ]);

  if (!title) {
    // Translation unavailable — show the original and let the UI mark it.
    return { ...source, translated: false };
  }

  return {
    title,
    summary: summary ?? '',
    sourceId: source.sourceId,
    lang: target,
    translated: true,
  };
}

export async function localizeStory(story: Story, lang: Lang): Promise<LocalizedText> {
  const native = pickNative(story.articles, lang);
  if (native) {
    return {
      title: native.title,
      summary: native.summary || story.summary,
      sourceId: native.sourceId,
      lang,
      translated: false,
    };
  }

  const lead = story.articles[0];
  if (!lead) {
    return { title: story.title, summary: story.summary, sourceId: '', lang: 'en', translated: false };
  }

  return translateInto(
    {
      title: story.title,
      summary: story.summary,
      sourceId: lead.sourceId,
      lang: lead.lang,
    },
    lang,
  );
}

export async function localizeArticle(article: Article, lang: Lang): Promise<LocalizedText> {
  if (article.lang === lang) {
    return {
      title: article.title,
      summary: article.summary,
      sourceId: article.sourceId,
      lang,
      translated: false,
    };
  }
  return translateInto(
    { title: article.title, summary: article.summary, sourceId: article.sourceId, lang: article.lang },
    lang,
  );
}

/** Runs jobs with bounded concurrency — the translation API is a shared, free service. */
async function pooled<T>(jobs: (() => Promise<T>)[], limit = 6): Promise<T[]> {
  const out: T[] = new Array(jobs.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, jobs.length) }, async () => {
    while (cursor < jobs.length) {
      const i = cursor++;
      const job = jobs[i];
      if (job) out[i] = await job();
    }
  });
  await Promise.all(workers);
  return out;
}

export async function attachStoryL10n(stories: Story[]): Promise<Story[]> {
  const pending = stories.filter((s) => !s.l10n);
  const resolved = await pooled(
    pending.map((story) => async () => {
      const entries = await Promise.all(
        LANGS.map(async (lang) => [lang, await localizeStory(story, lang)] as const),
      );
      return Object.fromEntries(entries) as Localized;
    }),
  );
  pending.forEach((story, i) => {
    const l10n = resolved[i];
    if (l10n) story.l10n = l10n;
  });
  return stories;
}

export async function attachArticleL10n(articles: Article[]): Promise<Article[]> {
  const pending = articles.filter((a) => !a.l10n);
  const resolved = await pooled(
    pending.map((article) => async () => {
      const entries = await Promise.all(
        LANGS.map(async (lang) => [lang, await localizeArticle(article, lang)] as const),
      );
      return Object.fromEntries(entries) as Localized;
    }),
  );
  pending.forEach((article, i) => {
    const l10n = resolved[i];
    if (l10n) article.l10n = l10n;
  });
  return articles;
}
