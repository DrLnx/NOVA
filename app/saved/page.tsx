import type { Metadata } from 'next';
import { getCorpus } from '@/lib/corpus';
import { SavedView } from './SavedView';

export const revalidate = 300;

export const metadata: Metadata = { title: 'Saved' };

export default async function SavedPage() {
  // The saved ids live in the reader's browser, so the whole corpus is handed
  // to the client and filtered there. Nothing about what you save is sent anywhere.
  const { articles } = await getCorpus();
  return <SavedView articles={articles} />;
}
