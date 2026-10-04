import {
  Baby,
  BookOpen,
  Calculator,
  Dumbbell,
  Languages,
  Music,
  School,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export const NICHE_ICONS: Record<string, LucideIcon> = {
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
  regular_school: 'from-territory-brand/90 to-territory-brand/70',
  daycare: 'from-territory-sun/90 to-territory-warning/80',
  language_school: 'from-territory-success/90 to-territory-success/70',
  prep_course: 'from-territory-warning/90 to-territory-sun/80',
  technical_school: 'from-territory-info/90 to-territory-brand/80',
  tutoring_center: 'from-territory-info/90 to-territory-info/70',
  music_school: 'from-territory-brand/85 to-territory-sun/75',
  sports_school: 'from-territory-success/90 to-territory-brand/75',
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
    .map((word, index) =>
      index === 0 || !LOWERCASE_WORDS.has(word)
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word,
    )
    .join(' ');
}
