import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getArticle, getCorpus, getStoryForArticle } from '@/lib/corpus';
import { attachArticleL10n } from '@/lib/localize';
import { ArticleView } from './ArticleView';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: 'Not found' };
  return { title: article.title, description: article.summary || undefined };
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  const story = await getStoryForArticle(id);
  const others = story?.articles.filter((a) => a.id !== id) ?? [];

  const { articles } = await getCorpus();
  const moreFromSource = articles
    .filter((a) => a.sourceId === article.sourceId && a.id !== id)
    .slice(0, 5);

  await attachArticleL10n([article, ...others, ...moreFromSource]);

  return (
    <ArticleView
      article={article}
      story={story}
      others={others}
      moreFromSource={moreFromSource}
    />
  );
}
