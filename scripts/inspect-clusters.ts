/**
 * Prints the biggest clusters so the similarity threshold can be judged against
 * real headlines instead of guessed. Pass a threshold to compare:
 *
 *   npm run inspect:clusters
 *   npm run inspect:clusters -- 0.30
 */
import { SOURCES } from '../lib/sources';
import { fetchAll } from '../lib/fetch';
import { clusterArticles, toStories, SIMILARITY_THRESHOLD } from '../lib/cluster';
import { getSource } from '../lib/sources';

const threshold = Number.parseFloat(process.argv[2] ?? '') || SIMILARITY_THRESHOLD;

const results = await fetchAll(SOURCES);
const seen = new Set<string>();
const articles = results
  .flatMap((r) => r.articles)
  .filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));

const t0 = Date.now();
const clusters = clusterArticles(articles, threshold);
const stories = toStories(clusters);
const ms = Date.now() - t0;

const multi = stories.filter((s) => s.sourceIds.length > 1);
const cross = multi.filter((s) => s.crossBorder);

console.log(`\n  threshold ${threshold}  ·  ${articles.length} articles  ·  ${stories.length} stories  ·  ${ms}ms`);
console.log(`  ${multi.length} stories with 2+ sources  ·  ${cross.length} of those span DE and international outlets\n`);

const show = process.argv.includes('--all') ? multi : multi.slice(0, 14);
for (const s of [...show].sort((a, b) => b.articles.length - a.articles.length)) {
  const flag = s.crossBorder ? ' [DE+INTL]' : '';
  console.log(`  ▸ ${s.sourceIds.length} sources · ${s.articles.length} articles · ${s.category}${flag}`);
  for (const a of s.articles) {
    const src = getSource(a.sourceId);
    console.log(`      ${(src?.short ?? a.sourceId).padEnd(13)} ${a.lang}  ${a.title.slice(0, 84)}`);
  }
  console.log();
}

// A sanity signal in the other direction: singletons should look genuinely unique.
console.log(`  ${stories.length - multi.length} single-source stories. A sample:`);
for (const s of stories.filter((x) => x.sourceIds.length === 1).slice(0, 5)) {
  console.log(`      ${(getSource(s.articles[0]!.sourceId)?.short ?? '').padEnd(13)} ${s.title.slice(0, 84)}`);
}
console.log();
