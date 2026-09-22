/**
 * Feed health check. Fetches every registered feed and reports how many items
 * survive normalisation, so a source that quietly starts returning nothing is
 * visible rather than just absent from the site.
 *
 *   npm run check:feeds
 */
import { SOURCES } from '../lib/sources';
import { fetchAll } from '../lib/fetch';
import type { Category } from '../lib/types';

const started = Date.now();
const results = await fetchAll(SOURCES);

let total = 0;
let withImage = 0;
let withSummary = 0;
const failures: string[] = [];
const byCategory = new Map<Category, number>();

console.log('\n  SOURCE / FEED                                        HTTP   ITEMS  IMG  SUM');
console.log('  ' + '─'.repeat(84));

for (const r of results) {
  const label = `${r.sourceId}  ${r.url.replace(/^https?:\/\//, '').slice(0, 44)}`;
  if (r.error) {
    failures.push(`${r.sourceId} — ${r.url} — ${r.error}`);
    console.log(`  ${label.padEnd(52)} ${'FAIL'.padEnd(6)} ${r.error}`);
    continue;
  }
  const img = r.articles.filter((a) => a.image).length;
  const sum = r.articles.filter((a) => a.summary.length > 20).length;
  total += r.articles.length;
  withImage += img;
  withSummary += sum;
  for (const a of r.articles) byCategory.set(a.category, (byCategory.get(a.category) ?? 0) + 1);

  const flag = r.articles.length === 0 ? '  ⚠ zero usable items' : '';
  console.log(`  ${label.padEnd(52)} ${'ok'.padEnd(6)} ${String(r.articles.length).padEnd(6)} ${String(img).padEnd(4)} ${String(sum).padEnd(4)}${flag}`);
}

console.log('  ' + '─'.repeat(84));
console.log(`\n  ${total} articles from ${results.length} feeds in ${((Date.now() - started) / 1000).toFixed(1)}s`);
console.log(`  images: ${withImage} (${Math.round((withImage / total) * 100)}%)   summaries: ${withSummary} (${Math.round((withSummary / total) * 100)}%)`);
console.log('\n  by category:');
for (const [cat, n] of [...byCategory].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${cat.padEnd(12)} ${String(n).padStart(4)}  ${'█'.repeat(Math.round(n / 4))}`);
}
if (failures.length) {
  console.log(`\n  ${failures.length} failing feed(s):`);
  for (const f of failures) console.log(`    ✗ ${f}`);
}
console.log();
