import 'server-only';
import type { Story } from './types';
import type { Lang } from './types';

/**
 * Optional AI briefings.
 *
 * SCOPE is fully useful without this. When no ANTHROPIC_API_KEY is present the
 * module is never called and the UI simply omits the section — it does not fall
 * back to generating something weaker, and it never presents a summary as
 * anything other than machine-written.
 */
export function aiEnabled(): boolean {
  return Boolean(process.env['ANTHROPIC_API_KEY']);
}

export interface AiBriefing {
  points: string[];
  model: string;
}

const MODEL = 'claude-sonnet-5';
const TTL_MS = 30 * 60 * 1000;

const cache = new Map<string, { briefing: AiBriefing; expires: number }>();

/**
 * Three neutral bullets on why a story matters. The prompt is given only the
 * headlines and feed summaries SCOPE already holds, and is told explicitly not
 * to add facts, because the one failure mode that would make this worse than
 * nothing is confident invention.
 */
export async function briefStory(story: Story, lang: Lang): Promise<AiBriefing | null> {
  if (!aiEnabled()) return null;

  const key = `${story.id}:${lang}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.briefing;

  const coverage = story.articles
    .slice(0, 8)
    .map((a) => `- [${a.sourceId}] ${a.title}${a.summary ? ` — ${a.summary}` : ''}`)
    .join('\n');

  const instruction =
    lang === 'de'
      ? 'Antworte auf Deutsch. Schreibe genau drei kurze Stichpunkte dazu, warum diese Meldung relevant ist, für eine Studentin oder einen Studenten, die sich über aktuelle Ereignisse informieren will.'
      : 'Answer in English. Write exactly three short bullet points on why this story matters, for a student trying to understand current events.';

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env['ANTHROPIC_API_KEY'] ?? '',
        'anthropic-version': '2023-06-01',
      },
      signal: AbortSignal.timeout(12_000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system:
          'You explain the significance of news stories neutrally and without speculation. ' +
          'Use ONLY the headlines and summaries provided. Do not introduce facts, figures, ' +
          'names or causes that are not present in the input. If the input is too thin to ' +
          'support a point, write fewer points rather than inventing one. No preamble. ' +
          'Return one bullet per line, each starting with "- ".',
        messages: [
          {
            role: 'user',
            content: `${instruction}\n\nStory: ${story.title}\n\nCoverage:\n${coverage}`,
          },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === 'text')?.text ?? '';
    const points = text
      .split('\n')
      .map((line) => line.replace(/^[-*•]\s*/, '').trim())
      .filter((line) => line.length > 0)
      .slice(0, 3);

    if (points.length === 0) return null;

    const briefing: AiBriefing = { points, model: MODEL };
    cache.set(key, { briefing, expires: Date.now() + TTL_MS });
    return briefing;
  } catch {
    // A failed or slow briefing is never allowed to affect the page.
    return null;
  }
}
