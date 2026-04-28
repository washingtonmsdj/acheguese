import { memo } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import type { EducationProfileStatus, EducationLeadStatus } from '../types';

export interface EducationStatusBadgeProps {
  status: EducationProfileStatus | EducationLeadStatus;
  type: 'profile' | 'lead';
  className?: string;
}

const PROFILE_STATUS_MAP: Record<EducationProfileStatus, { label: string; variant: string }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  published: { label: 'Publicado', variant: 'default' },
  paused: { label: 'Pausado', variant: 'destructive' },
};

const LEAD_STATUS_MAP: Record<EducationLeadStatus, { label: string; variant: string }> = {
  new: { label: 'Novo', variant: 'default' },
  contacted: { label: 'Contactado', variant: 'secondary' },
  visit_scheduled: { label: 'Visita Agendada', variant: 'outline' },
  proposal_sent: { label: 'Proposta Enviada', variant: 'outline' },
  enrolled: { label: 'Matriculado', variant: 'default' },
  lost: { label: 'Perdido', variant: 'destructive' },
};

export const EducationStatusBadge = memo(function EducationStatusBadge({
  status,
  type,
  className,
}: EducationStatusBadgeProps) {
  const config = type === 'profile'
    ? PROFILE_STATUS_MAP[status as EducationProfileStatus]
    : LEAD_STATUS_MAP[status as EducationLeadStatus];

  if (!config) return null;

  return (
    <Badge
      variant={config.variant as 'default' | 'secondary' | 'destructive' | 'outline'}
      className={cn('text-xs font-medium', className)}
    >
      {config.label}
    </Badge>
  );
});
