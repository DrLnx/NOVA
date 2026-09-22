import type { Metadata } from 'next';
import { getStories } from '@/lib/corpus';
import { BriefingView } from './BriefingView';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Briefing',
  description: 'The stories that mattered today, in five minutes.',
};

export default async function BriefingPage() {
  // Stories arrive sorted by weight, so the top of the list is the briefing.
  const stories = await getStories({}, 6);
  return <BriefingView stories={stories} />;
}
