import { NextResponse } from 'next/server';
import { getCorpus } from '@/lib/corpus';
import { searchArticles, type SearchFilters } from '@/lib/search';
import { attachArticleL10n } from '@/lib/localize';
import { CATEGORIES, type Category, type Region } from '@/lib/types';
import { SOURCE_BY_ID } from '@/lib/sources';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = (params.get('q') ?? '').slice(0, 120);

  const filters: SearchFilters = {};

  const category = params.get('category');
  if (category && (CATEGORIES as readonly string[]).includes(category)) {
    filters.category = category as Category;
  }

  const sourceId = params.get('source');
  if (sourceId && SOURCE_BY_ID.has(sourceId)) filters.sourceId = sourceId;

  const region = params.get('region');
  if (region === 'de' || region === 'global') filters.region = region as Region;

  const within = Number.parseInt(params.get('within') ?? '', 10);
  if (Number.isFinite(within) && within > 0) filters.withinHours = within;

  const limit = Math.min(Number.parseInt(params.get('limit') ?? '40', 10) || 40, 100);

  const { articles } = await getCorpus();
  const hits = searchArticles(articles, query, filters, limit);
  const results = await attachArticleL10n(hits.map((h) => h.article));

  return NextResponse.json(
    { query, count: results.length, results },
    { headers: { 'cache-control': 'no-store' } },
  );
}
