import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCorpus, invalidateCorpus } from '@/lib/corpus';

export const dynamic = 'force-dynamic';

/** Manual refresh, for when you do not want to wait out the five-minute window. */
export async function POST() {
  invalidateCorpus();
  const corpus = await getCorpus();
  revalidatePath('/', 'layout');
  return NextResponse.json({
    ok: true,
    builtAt: corpus.builtAt,
    articles: corpus.articles.length,
    stories: corpus.stories.length,
    failures: corpus.failures,
  });
}
