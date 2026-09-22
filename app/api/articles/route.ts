import { NextResponse } from 'next/server';
import { getCorpus } from '@/lib/corpus';
import { attachArticleL10n } from '@/lib/localize';

export const dynamic = 'force-dynamic';

/**
 * Look up specific articles by id, localized.
 *
 * The reading list lives in the reader's browser, so the server cannot know
 * which articles to prepare. Asking for them by id keeps the saved page from
 * having to receive the entire corpus just to filter it down to a handful.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const ids = (params.get('ids') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => /^[a-z0-9]{1,16}$/.test(id))
    .slice(0, 200);

  if (ids.length === 0) {
    return NextResponse.json({ results: [] }, { headers: { 'cache-control': 'no-store' } });
  }

  const { byId } = await getCorpus();
  const found = ids.map((id) => byId.get(id)).filter((a) => a !== undefined);
  const results = await attachArticleL10n(found);

  return NextResponse.json(
    { results, missing: ids.length - results.length },
    { headers: { 'cache-control': 'no-store' } },
  );
}
