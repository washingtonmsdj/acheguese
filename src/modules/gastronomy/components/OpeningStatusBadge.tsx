import { Badge } from '@/shared/components/ui/badge';
import { Clock } from 'lucide-react';
import { OpeningHoursService } from '@/core/business/services/OpeningHoursService';
import type { BusinessHours } from '@/core/business/types';

interface Props {
  openingHours: BusinessHours | null | undefined;
}

export function OpeningStatusBadge({ openingHours }: Props) {
  const status = OpeningHoursService.calculateStatus(openingHours);

  return (
    <Badge variant={status.is_open ? 'default' : 'secondary'} className="gap-1">
      <Clock className="h-3 w-3" />
      {status.status_text}
    </Badge>
  );
}
