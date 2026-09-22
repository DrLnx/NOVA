import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCorpus, getStory } from '@/lib/corpus';
import { tokenize } from '@/lib/cluster';
import { findGlossary } from '@/lib/glossary';
import { briefStory } from '@/lib/ai';
import { StoryView } from './StoryView';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) return { title: 'Not found' };
  return {
    title: story.title,
    description: story.summary || undefined,
  };
}

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) notFound();

  // Glossary lookup runs over clustering tokens, so it inherits the alias
  // bridge: a German article saying "EZB" resolves the same as an English "ECB".
  const tokens = story.articles.flatMap((a) => tokenize(`${a.title} ${a.summary}`));
  const glossary = findGlossary(tokens, 3);

  const { stories } = await getCorpus();
  const related = stories
    .filter((s) => s.id !== story.id && s.category === story.category)
    .slice(0, 6);

  // Null whenever no ANTHROPIC_API_KEY is set, which is the normal case.
  const briefing = await briefStory(story, 'de');

  return (
    <StoryView story={story} glossary={glossary} related={related} briefing={briefing} />
  );
}
