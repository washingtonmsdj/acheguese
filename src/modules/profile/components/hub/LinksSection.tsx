/**
 * LinksSection - Seção de links reutilizável
 * 
 * Exibe uma grade de links organizados por categoria
 */

import type { LucideIcon } from 'lucide-react';
import { HubLinkCard } from './HubLinkCard';
import { SectionFrame } from './SectionFrame';

interface Link {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
}

interface LinksSectionProps {
  title: string;
  description: string;
  links: Link[];
  columns?: 2 | 3;
}

export function LinksSection({ title, description, links, columns = 2 }: LinksSectionProps) {
  const gridClass = columns === 3 ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2';

  return (
    <SectionFrame title={title} description={description}>
      <div className={`grid gap-3 ${gridClass}`}>
        {links.map((link) => (
          <HubLinkCard key={link.title} {...link} />
        ))}
      </div>
    </SectionFrame>
  );
}
