import { memo } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import type { EducationProfileStatus, EducationLeadStatus } from '@/core/education';
import { EDUCATION_LEAD_STATUS, EDUCATION_PROFILE_STATUS } from '../constants';

export interface EducationStatusBadgeProps {
  status: EducationProfileStatus | EducationLeadStatus;
  type: 'profile' | 'lead';
  className?: string;
}

export const EducationStatusBadge = memo(function EducationStatusBadge({
  status,
  type,
  className,
}: EducationStatusBadgeProps) {
  const config = type === 'profile'
    ? EDUCATION_PROFILE_STATUS[status as EducationProfileStatus]
    : EDUCATION_LEAD_STATUS[status as EducationLeadStatus];

  if (!config) return null;

  return (
    <Badge
      variant={config.variant}
      className={cn('text-xs font-medium', className)}
    >
      {config.label}
    </Badge>
  );
});
