import type { Metadata } from 'next';
import { getCorpus } from '@/lib/corpus';
import { SourcesView } from './SourcesView';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Sources',
  description: 'Every newsroom SCOPE pulls from, with its ownership and funding.',
};

export default async function SourcesPage() {
  const { articles, failures } = await getCorpus();

  const counts: Record<string, number> = {};
  for (const a of articles) counts[a.sourceId] = (counts[a.sourceId] ?? 0) + 1;

  return <SourcesView counts={counts} failures={failures} />;
}
