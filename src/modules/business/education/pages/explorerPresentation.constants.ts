import { Baby, BookOpen, Calculator, Dumbbell, Languages, Music, School, Wrench } from 'lucide-react';

export const NICHE_ICONS: Record<string, React.ElementType> = {
  regular_school: School,
  daycare: Baby,
  language_school: Languages,
  prep_course: Calculator,
  technical_school: Wrench,
  tutoring_center: BookOpen,
  music_school: Music,
  sports_school: Dumbbell,
};

export const NICHE_ACCENT: Record<string, string> = {
  regular_school: 'from-blue-500/90 to-indigo-600/90',
  daycare: 'from-pink-400/90 to-rose-500/90',
  language_school: 'from-emerald-400/90 to-teal-600/90',
  prep_course: 'from-orange-400/90 to-amber-600/90',
  technical_school: 'from-violet-500/90 to-purple-600/90',
  tutoring_center: 'from-cyan-400/90 to-blue-500/90',
  music_school: 'from-fuchsia-400/90 to-pink-600/90',
  sports_school: 'from-lime-400/90 to-green-600/90',
};

export const SCHOOL_NETWORK_LABELS: Record<string, string> = {
  municipal: 'Municipal',
  state: 'Estadual',
  federal: 'Federal',
  private: 'Privada',
};

export const CARD_HIDDEN_STAT_LABELS = new Set(['ensino', 'fonte']);

export function slugToLabel(slug: string): string {
  const LOWERCASE_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o']);
  return slug
    .split('-')
    .map((word, i) =>
      i === 0 || !LOWERCASE_WORDS.has(word)
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word
    )
    .join(' ');
}
