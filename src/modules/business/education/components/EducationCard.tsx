import { memo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, GraduationCap, Users, Phone, ChevronRight } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import type { EducationProfile } from '../types';

export interface EducationCardProps {
  profile: EducationProfile;
  variant?: 'grid' | 'list' | 'compact';
  className?: string;
}

const CARD_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export const EducationCard = memo(function EducationCard({
  profile,
  variant = 'grid',
  className,
}: EducationCardProps) {
  const isGrid = variant === 'grid';
  const isCompact = variant === 'compact';

  return (
    <motion.div
      {...CARD_ANIMATION}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border bg-card',
        'transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg',
        isGrid && 'flex flex-col',
        isCompact && 'flex flex-row items-center gap-3 p-3',
        !isCompact && 'p-4',
        className,
      )}
    >
      {!isCompact && (
        <div className="mb-3 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          {profile.status === 'published' && (
            <Badge variant="secondary" className="text-xs">
              Ativo
            </Badge>
          )}
        </div>
      )}

      <div className={cn('flex-1', isCompact && 'min-w-0')}>
        <h3 className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
          {profile.institution_type}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {profile.summary ?? 'Sem descricao'}
        </p>

        <div
          className={cn(
            'mt-2 flex items-center gap-3 text-xs text-muted-foreground',
            isCompact && 'mt-1',
          )}
        >
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {profile.niche_key.replaceAll('_', ' ')}
          </span>
          {profile.whatsapp_number && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              WhatsApp
            </span>
          )}
        </div>
      </div>

      {!isCompact && (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            Ver detalhes
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-colors group-hover:text-primary" />
        </div>
      )}
    </motion.div>
  );
});
