'use client';

import type { Category } from '@/lib/types';
import { useApp, useDict } from './Providers';
import s from './CategoryHeading.module.css';

const BLURB: Record<Category, { de: string; en: string }> = {
  politics: {
    de: 'Bundespolitik, Landtage, Parteien und Gesetzgebung.',
    en: 'Federal and state politics, parties and legislation.',
  },
  economy: {
    de: 'Konjunktur, Geldpolitik, Arbeitsmarkt und Unternehmen.',
    en: 'The economy, monetary policy, labour and companies.',
  },
  technology: {
    de: 'Digitalpolitik, IT-Sicherheit, KI und Plattformen.',
    en: 'Digital policy, security, AI and the platforms.',
  },
  science: {
    de: 'Forschung, Klima, Medizin und Raumfahrt.',
    en: 'Research, climate, medicine and space.',
  },
  society: {
    de: 'Bildung, Justiz, Migration, Wohnen und Kultur.',
    en: 'Education, justice, migration, housing and culture.',
  },
  world: {
    de: 'Internationale Politik, Konflikte und Diplomatie.',
    en: 'International affairs, conflict and diplomacy.',
  },
};

export function CategoryHeading({ category, count }: { category: Category; count: number }) {
  const dict = useDict();
  const { lang } = useApp();

  return (
    <header className={s.head}>
      <h1 className={s.title}>{dict.categories[category]}</h1>
      <p className={s.blurb}>{BLURB[category][lang]}</p>
    </header>
  );
}
