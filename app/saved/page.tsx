import type { Metadata } from 'next';
import { SavedView } from './SavedView';

export const metadata: Metadata = { title: 'Saved' };

export default function SavedPage() {
  // The saved ids live only in the reader's browser, so the list is resolved
  // client-side against /api/articles rather than shipping the whole corpus.
  return <SavedView />;
}
