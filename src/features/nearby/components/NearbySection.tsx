/**
 * NearbySection — Bloco modular reutilizável para a página Perto de Mim.
 * Exibe uma seção com título, ícone, contagem e lista horizontal/grid de cards.
 */

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export interface NearbySectionProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColorClass?: string;
  count?: number;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  children: ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function NearbySection({
  title,
  subtitle,
  icon: Icon,
  iconColorClass = 'bg-primary/10 text-primary',
  count,
  onSeeAll,
  seeAllLabel = 'Ver todos',
  children,
  isEmpty,
  emptyMessage = 'Nenhum resultado encontrado',
  isLoading,
}: NearbySectionProps) {
  if (isEmpty && !isLoading) return null;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={containerVariants}
      className="py-6"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${iconColorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
              {title}
              {count != null && count > 0 && (
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </h2>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {onSeeAll && (
          <Button variant="ghost" size="sm" onClick={onSeeAll} className="gap-1 text-primary">
            {seeAllLabel} <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </motion.div>
      <motion.div variants={itemVariants}>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : (
          children
        )}
      </motion.div>
    </motion.section>
  );
}
