# SCOPE

Personal news intelligence. German and global current events from reliable
sources, grouped by the **event** rather than by the outlet — so you can see at a
glance how differently five newsrooms describe the same thing, and how much
weight a story actually carries.

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. No API keys, no accounts, no database.

---

## What it does differently

**Stories, not articles.** A TF-IDF clustering pass groups articles covering the
same event. A story page puts every outlet's own headline and opening line side
by side, so editorial framing becomes something you read rather than something
you have to already know about.

**Cross-language grouping.** A ~120-entry alias table canonicalises German and
English surface forms (`Selenskyj` ↔ `Zelensky`, `Waffenruhe` ↔ `ceasefire`,
`Militärjet` ↔ `aircraft`) before vectorising, so a tagesschau piece and a BBC
piece about the same event land in one story.

**Visible weighting.** Every story carries an importance score out of 100, and
the story page shows the arithmetic behind it — sources, countries, cross-border
spread, source tier, recency. The number shown is the same number that orders
the feed; there is no hidden ranking behind the badge.

**Source transparency.** `/sources` lists every newsroom with its ownership and
funding, and flags the ones that take an explicit editorial position.

---

## Architecture

```
lib/
  sources.ts      17 outlets / 32 feeds, every one probed before being added
  fetch.ts        8s timeout, Promise.all, never throws
  parse.ts        RSS 2.0 + Atom + RDF in one path
  normalize.ts    images, summaries, dates, junk filtering
  classify.ts     category assignment; drops sport/lifestyle/round-ups
  linguistics.ts  stopwords + the cross-language alias bridge
  cluster.ts      TF-IDF cosine + rare-entity boost
  rank.ts         the importance weighting
  corpus.ts       getCorpus() — the one cached entry point pages read
  glossary.ts     ~25 hand-written background entries
  ai.ts           optional, off unless ANTHROPIC_API_KEY is set
```

Next.js 16 App Router. Pages are server components; the client bundle carries
only the theme and language toggles, the ⌘K palette, filters and bookmarks.
Feeds refresh every 5 minutes.

### Notes on some decisions

**Clustering threshold is 0.34**, tuned against a live 1,189-article corpus
rather than guessed. At 0.40 the two loosest clusters tighten up, but a genuine
five-outlet story gets torn apart and three cross-border groupings are lost.
Splitting a real story hides the comparison this site exists to show, so the
looser setting wins. Run `npm run inspect:clusters` to see the current output.

**Weighting maxima sum to exactly 100**, so the scale is real. An ordinary day's
top story lands in the seventies; 100 needs eight-plus outlets across six
countries, cross-border, minutes old. An earlier flat model saturated — the top
four stories all read 100, which told the reader nothing.

**Image URLs are never rewritten.** The Guardian signs its image URLs, so
"upgrading" the width parameter invalidates the signature and returns 401.

**Word lists are written in real German** (`Türkei`, not `tuerkei`) and folded at
construction, because `fold()` strips umlauts to a bare vowel. Hand-transliterating
them silently broke every match until it was caught.

### Excluded sources

Reuters (404) and AP (403) block automated feed access. The FT and Süddeutsche
return a single teaser item over RSS instead of an article list. All four were
tested and left out because they cannot supply usable items.

---

## Copyright

SCOPE stores and displays a **headline, the feed-provided summary, an image and a
link** — never full article text. Every card and detail view links back to the
publisher.

---

## Commands

| | |
|---|---|
| `npm run dev` | development server |
| `npm run build` | production build |
| `npm run typecheck` | TypeScript, strict |
| `npm run check:feeds` | fetch every feed, report usable items per source |
| `npm run inspect:clusters` | print clusters to judge the similarity threshold |
| `npm run inspect:weights` | print the weighting distribution, check for saturation |

`POST /api/refresh` forces a rebuild without waiting out the 5-minute window.

## Optional AI

Set `ANTHROPIC_API_KEY` to add a three-bullet briefing to story pages, clearly
labelled as machine-written. It is given only the headlines and summaries SCOPE
already holds and is instructed not to add facts. Without the key the section is
omitted — nothing degrades and nothing is fabricated.
