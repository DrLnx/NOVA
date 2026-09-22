/**
 * Shows the spread of the importance weighting over the live corpus, so the
 * scale can be checked for saturation instead of assumed sound.
 *
 *   npm run inspect:weights
 */
import { SOURCES, getSource } from '../lib/sources';
import { fetchAll } from '../lib/fetch';
import { clusterArticles, toStories } from '../lib/cluster';
import { rankStories, weighStory, levelFor } from '../lib/rank';

const results = await fetchAll(SOURCES);
const seen = new Set<string>();
const articles = results.flatMap((r) => r.articles).filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
const stories = rankStories(toStories(clusterArticles(articles)));

const buckets = new Map<string, number>();
for (const s of stories) buckets.set(levelFor(s.score), (buckets.get(levelFor(s.score)) ?? 0) + 1);

console.log(`\n  ${stories.length} stories\n`);
console.log('  level      count   share');
for (const level of ['lead', 'major', 'notable', 'routine']) {
  const n = buckets.get(level) ?? 0;
  console.log(`  ${level.padEnd(10)} ${String(n).padStart(5)}   ${((n / stories.length) * 100).toFixed(1)}%`);
}

const values = stories.map((s) => s.score);
const at100 = values.filter((v) => v === 100).length;
console.log(`\n  max ${Math.max(...values)}  ·  min ${Math.min(...values)}  ·  at 100: ${at100}`);
console.log(`  distinct values in top 20: ${new Set(values.slice(0, 20)).size}\n`);

console.log('  top 16:');
for (const s of stories.slice(0, 16)) {
  const w = weighStory(s);
  const parts = w.factors.map((f) => `${f.key[0]}${f.points}`).join(' ');
  console.log(
    `  ${String(w.value).padStart(3)} ${w.level.padEnd(8)} ${String(s.sourceIds.length).padStart(2)}src ${String(s.countries.length)}c ${(s.crossBorder ? 'X' : ' ')} ${parts.padEnd(30)} ${s.title.slice(0, 52)}`,
  );
}
console.log();
